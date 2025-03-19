const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const usuarioController = {
    // Crear usuario (solo administradores)
    async crearUsuario(req, res) {
        try {
            const { nombre, email, password, tipoUsuario, direccion, telefono, cargo, departamento } = req.body;
            
            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Crear usuario base
            const usuario = await prisma.usuario.create({
                data: {
                    nombre,
                    email,
                    password: hashedPassword,
                    tipoUsuario
                }
            });

            // Si es cliente, crear perfil de cliente
            if (tipoUsuario === 'CLIENTE') {
                await prisma.cliente.create({
                    data: {
                        usuarioId: usuario.id,
                        direccion,
                        telefono
                    }
                });
            }
            // Si es trabajador, crear perfil de trabajador
            else if (tipoUsuario === 'TRABAJADOR') {
                await prisma.trabajador.create({
                    data: {
                        usuarioId: usuario.id,
                        cargo,
                        departamento
                    }
                });
            }

            res.status(201).json({ message: 'Usuario creado exitosamente', userId: usuario.id });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    },

    // Listar usuarios (solo administradores)
    async listarUsuarios(req, res) {
        try {
            // Verificar si es administrador
            const adminId = req.usuario.id;
            const admin = await prisma.usuario.findUnique({
                where: { id: adminId }
            });

            if (!admin || admin.tipo !== 'ADMIN') {
                return res.status(403).json({ error: 'No tiene permisos para listar usuarios' });
            }

            const usuarios = await prisma.usuario.findMany({
                include: {
                    cliente: true,
                    trabajador: true
                }
            });

            res.json(usuarios);
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            res.status(500).json({ error: 'Error al listar usuarios' });
        }
    },

    // Obtener usuario por ID
    async obtenerUsuario(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar permisos
            const solicitanteId = req.usuario.id;
            const solicitante = await prisma.usuario.findUnique({
                where: { id: solicitanteId }
            });

            // Solo permitir ver los detalles si es el mismo usuario o un administrador
            if (solicitanteId !== parseInt(id) && solicitante.tipo !== 'ADMIN') {
                return res.status(403).json({ error: 'No tiene permisos para ver este usuario' });
            }

            const usuario = await prisma.usuario.findUnique({
                where: { id: parseInt(id) },
                include: {
                    cliente: true,
                    trabajador: true
                }
            });

            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            res.json(usuario);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    },

    // Actualizar usuario
    async actualizarUsuario(req, res) {
        try {
            const { id } = req.params;
            const { nombre, email, direccion, telefono, posicion, departamento } = req.body;

            // Verificar permisos
            const solicitanteId = req.usuario.id;
            const solicitante = await prisma.usuario.findUnique({
                where: { id: solicitanteId }
            });

            // Solo permitir actualizar si es el mismo usuario o un administrador
            if (solicitanteId !== parseInt(id) && solicitante.tipo !== 'ADMIN') {
                return res.status(403).json({ error: 'No tiene permisos para actualizar este usuario' });
            }

            const usuarioExistente = await prisma.usuario.findUnique({
                where: { id: parseInt(id) },
                include: {
                    cliente: true,
                    trabajador: true
                }
            });

            if (!usuarioExistente) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            const usuario = await prisma.usuario.update({
                where: { id: parseInt(id) },
                data: {
                    nombre,
                    email,
                    ...(usuarioExistente.tipo === 'CLIENTE' && {
                        cliente: {
                            update: {
                                direccion,
                                telefono
                            }
                        }
                    }),
                    ...(usuarioExistente.tipo === 'TRABAJADOR' && {
                        trabajador: {
                            update: {
                                posicion,
                                departamento
                            }
                        }
                    })
                },
                include: {
                    cliente: true,
                    trabajador: true
                }
            });

            res.json(usuario);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ error: 'Error al actualizar usuario' });
        }
    },

    // Eliminar usuario (solo administradores)
    async eliminarUsuario(req, res) {
        try {
            const { id } = req.params;

            // Verificar si es administrador
            const adminId = req.usuario.id;
            const admin = await prisma.usuario.findUnique({
                where: { id: adminId }
            });

            if (!admin || admin.tipo !== 'ADMIN') {
                return res.status(403).json({ error: 'No tiene permisos para eliminar usuarios' });
            }

            // Verificar que no se esté eliminando a sí mismo
            if (parseInt(id) === adminId) {
                return res.status(400).json({ error: 'No puede eliminar su propia cuenta de administrador' });
            }

            const usuario = await prisma.usuario.delete({
                where: { id: parseInt(id) }
            });

            res.json({ message: 'Usuario eliminado exitosamente' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log('Intento de login para:', email);

            const usuario = await prisma.usuario.findUnique({
                where: { email }
            });

            if (!usuario) {
                console.log('Usuario no encontrado:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            console.log('Usuario encontrado:', usuario.email);
            const validPassword = await bcrypt.compare(password, usuario.contrasena);
            
            if (!validPassword) {
                console.log('Contraseña inválida para:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            console.log('Contraseña válida para:', email);
            const token = jwt.sign(
                { 
                    id: usuario.id,
                    email: usuario.email,
                    tipo: usuario.tipoUsuario,
                    nombre: usuario.nombre
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    tipo: usuario.tipoUsuario,
                    direccion: usuario.direccion,
                    telefono: usuario.telefono,
                    rol: usuario.tipoUsuario
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Crear administrador inicial
    async crearAdminInicial(req, res) {
        try {
            const adminExists = await prisma.usuario.findFirst({
                where: { tipoUsuario: 'ADMIN' }
            });

            if (adminExists) {
                return res.status(400).json({ error: 'Ya existe un usuario administrador' });
            }

            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await prisma.usuario.create({
                data: {
                    nombre: 'Administrador',
                    email: 'admin@example.com',
                    contrasena: hashedPassword,
                    tipoUsuario: 'ADMIN'
                }
            });

            res.status(201).json({ message: 'Administrador creado exitosamente', userId: admin.id });
        } catch (error) {
            console.error('Error al crear admin:', error);
            res.status(500).json({ error: 'Error al crear administrador' });
        }
    }
};

// Crear admin al iniciar la aplicación
(async () => {
    try {
        const adminExists = await prisma.usuario.findFirst({
            where: { tipoUsuario: 'ADMIN' }
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await prisma.usuario.create({
                data: {
                    nombre: 'Administrador',
                    email: 'admin@example.com',
                    contrasena: hashedPassword,
                    tipoUsuario: 'ADMIN'
                }
            });
            console.log('Usuario administrador creado exitosamente');
        }
    } catch (error) {
        console.error('Error al crear usuario administrador:', error);
    }
})();

module.exports = usuarioController;
