const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const usuarioController = {
    // Crear usuario (solo administradores)
    async crearUsuario(req, res) {
        try {
            // Verificar si el usuario que hace la petición es administrador
            const adminId = req.usuario.id;
            const admin = await prisma.usuario.findUnique({
                where: { id: adminId }
            });

            if (!admin || admin.tipo !== 'ADMIN') {
                return res.status(403).json({ error: 'No tiene permisos para crear usuarios' });
            }

            const { nombre, email, contrasena, tipo, direccion, telefono, posicion, departamento } = req.body;
            
            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(contrasena, 10);
            
            // Crear usuario base
            const usuario = await prisma.usuario.create({
                data: {
                    nombre,
                    email,
                    contrasena: hashedPassword,
                    tipo,
                    createdBy: adminId
                }
            });

            // Si es cliente, crear perfil de cliente
            if (tipo === 'CLIENTE') {
                await prisma.cliente.create({
                    data: {
                        usuarioId: usuario.id,
                        direccion,
                        telefono
                    }
                });
            }
            // Si es trabajador, crear perfil de trabajador
            else if (tipo === 'TRABAJADOR') {
                await prisma.trabajador.create({
                    data: {
                        usuarioId: usuario.id,
                        posicion,
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
            const { email, contrasena } = req.body;
            console.log('Intento de login para:', email);
            console.log('JWT_SECRET:', process.env.JWT_SECRET);

            const usuario = await prisma.usuario.findUnique({
                where: { email },
                include: {
                    cliente: true,
                    trabajador: true
                }
            });

            if (!usuario) {
                console.log('Usuario no encontrado:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            console.log('Usuario encontrado:', usuario.email);
            const validPassword = await bcrypt.compare(contrasena, usuario.contrasena);
            
            if (!validPassword) {
                console.log('Contraseña inválida para:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            console.log('Contraseña válida para:', email);
            console.log('Datos para el token:', {
                id: usuario.id,
                email: usuario.email,
                tipo: usuario.tipo
            });

            try {
                const token = jwt.sign(
                    { 
                        id: usuario.id, 
                        email: usuario.email, 
                        tipo: usuario.tipo 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                console.log('Token generado para:', email);

                res.json({
                    token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        tipo: usuario.tipo,
                        perfil: usuario.tipo === 'CLIENTE' ? usuario.cliente : usuario.trabajador
                    }
                });
            } catch (jwtError) {
                console.error('Error al generar el token:', jwtError);
                res.status(500).json({ error: 'Error al generar el token' });
            }
        } catch (error) {
            console.error('Error en el proceso de login:', error);
            res.status(500).json({ error: 'Error en el proceso de login' });
        }
    },

    // Crear administrador inicial
    async crearAdminInicial(req, res) {
        try {
            // Verificar si ya existe algún administrador
            const adminExistente = await prisma.usuario.findFirst({
                where: { tipo: 'ADMIN' }
            });

            if (adminExistente) {
                return res.status(400).json({ error: 'Ya existe un administrador en el sistema' });
            }

            const { nombre, email, contrasena } = req.body;
            
            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(contrasena, 10);
            
            // Crear administrador
            const admin = await prisma.usuario.create({
                data: {
                    nombre,
                    email,
                    contrasena: hashedPassword,
                    tipo: 'ADMIN'
                }
            });

            // Generar token
            const token = jwt.sign(
                { 
                    id: admin.id, 
                    email: admin.email, 
                    tipo: admin.tipo 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Administrador inicial creado exitosamente',
                token,
                usuario: {
                    id: admin.id,
                    nombre: admin.nombre,
                    email: admin.email,
                    tipo: admin.tipo
                }
            });
        } catch (error) {
            console.error('Error al crear administrador inicial:', error);
            res.status(500).json({ error: 'Error al crear administrador inicial' });
        }
    }
};

const crearAdmin = async () => {
    try {
        const adminExists = await prisma.usuario.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await prisma.usuario.create({
                data: {
                    nombre: 'Admin',
                    email: 'admin@example.com',
                    contrasena: hashedPassword,
                    tipo: 'ADMIN'
                }
            });
            console.log('Admin user created successfully:', admin);
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Create admin user on startup
crearAdmin();

module.exports = usuarioController;
