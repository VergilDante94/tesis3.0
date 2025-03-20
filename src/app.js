require('dotenv').config();
const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const prisma = new PrismaClient();
const servicioRoutes = require('../backend/routes/servicioRoutes');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Middleware para verificar token
const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al verificar token' });
    }
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
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
                tipo: usuario.tipo,
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
                tipo: usuario.tipo,
                direccion: usuario.direccion || '',
                telefono: usuario.telefono || ''
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para actualizar el perfil del usuario
app.put('/api/usuarios/me', verificarToken, async (req, res) => {
    try {
        console.log('Petición de actualización recibida:');
        console.log('Headers:', req.headers);
        console.log('Body completo:', req.body);
        
        const { nombre, direccion, telefono, password } = req.body;
        const usuarioId = req.user.id;
        
        console.log(`Actualizando perfil de usuario ID ${usuarioId} con datos:`, { 
            nombre, 
            direccion, 
            telefono,
            password: password ? '[PRESENTE]' : '[NO PRESENTE]'
        });
        
        // Construir objeto de actualización - asegurarse que los campos estén definidos
        const updateData = {};
        
        // Asignar explícitamente cada campo solo si está presente
        if (nombre !== undefined) updateData.nombre = String(nombre);
        if (direccion !== undefined) updateData.direccion = String(direccion);
        if (telefono !== undefined) updateData.telefono = String(telefono);
        
        // Si hay password, añadirlo encriptado
        if (password) {
            updateData.contrasena = await bcrypt.hash(password, 10);
        }
        
        console.log('Datos de actualización finales:', updateData);
        
        // Actualizar el usuario directamente usando Prisma - usar transacción para garantizar consistencia
        const usuario = await prisma.$transaction(async (tx) => {
            // Actualizar usuario
            const updatedUser = await tx.usuario.update({
                where: { id: usuarioId },
                data: updateData
            });
            
            // También actualizar la tabla cliente si existe
            const cliente = await tx.cliente.findUnique({
                where: { usuarioId: usuarioId }
            });
            
            if (cliente && (direccion !== undefined || telefono !== undefined)) {
                const clienteUpdateData = {};
                if (direccion !== undefined) clienteUpdateData.direccion = String(direccion);
                if (telefono !== undefined) clienteUpdateData.telefono = String(telefono);
                
                await tx.cliente.update({
                    where: { id: cliente.id },
                    data: clienteUpdateData
                });
                console.log('Actualizada la información de cliente asociada');
            }
            
            return updatedUser;
        });
        
        console.log('Usuario actualizado con éxito:', usuario);
        res.json(usuario);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ 
            error: 'Error al actualizar el perfil', 
            detalle: error.message,
            stack: error.stack
        });
    }
});

// Ruta para obtener información del usuario actual
app.get('/api/usuarios/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                nombre: true,
                tipo: true,
                direccion: true,
                telefono: true
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Rutas de servicios
app.use('/api/servicios', servicioRoutes);

// Rutas de órdenes
app.post('/api/ordenes', async (req, res) => {
  try {
    const { clienteId, servicios } = req.body;
    console.log('Creando orden:', { clienteId, servicios });

    // Buscar el cliente asociado al usuario
    const cliente = await prisma.cliente.findUnique({
      where: { usuarioId: parseInt(clienteId) }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado para este usuario' });
    }

    const orden = await prisma.orden.create({
      data: {
        clienteId: cliente.id,
        estado: 'PENDIENTE',
        servicios: {
          create: servicios.map(s => ({
            servicioId: s.servicioId,
            cantidad: s.cantidad,
            precioUnitario: 0 // Será actualizado después
          }))
        }
      },
      include: {
        cliente: true,
        servicios: {
          include: {
            servicio: true
          }
        }
      }
    });

    // Actualizar precios unitarios para cada servicio en la orden
    for (const ordenServicio of orden.servicios) {
      await prisma.ordenServicio.update({
        where: { id: ordenServicio.id },
        data: {
          precioUnitario: ordenServicio.servicio.precioBase
        }
      });
    }

    // Crear notificación de nueva orden
    await prisma.notificacion.create({
      data: {
        usuarioId: clienteId,
        mensaje: `Nueva orden creada #${orden.id}`,
      }
    });

    res.status(201).json(orden);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

// Añadir ruta GET para obtener usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        // Verificar el token y el tipo de usuario
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.params;
        
        // Verificar permisos - solo el propio usuario o un administrador puede ver detalles
        if (decoded.id !== parseInt(id) && decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'No tiene permisos para ver este usuario' });
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

        // Remover campos sensibles
        delete usuario.contrasena;

        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        // Obtener solo usuarios activos (a menos que se especifique lo contrario)
        const mostrarInactivos = req.query.mostrarInactivos === 'true';
        const whereCondition = mostrarInactivos ? {} : { activo: true };

        const usuarios = await prisma.usuario.findMany({
            where: whereCondition,
            include: {
                cliente: true,
                trabajador: true
            }
        });

        // Eliminar información sensible antes de enviar la respuesta
        const usuariosSeguros = usuarios.map(usuario => {
            const usuarioSeguro = { ...usuario };
            delete usuarioSeguro.contrasena;
            return usuarioSeguro;
        });

        res.json(usuariosSeguros);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

// Ruta para crear usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { nombre, email, tipo, password, direccion, telefono, posicion, departamento } = req.body;

        if (!nombre || !email || !tipo || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Usar transacción para crear usuario y sus registros relacionados
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear el usuario base
            const nuevoUsuario = await tx.usuario.create({
                data: {
                    nombre,
                    email,
                    tipo,
                    contrasena: hashedPassword,
                    direccion,
                    telefono,
                    createdBy: decoded.id
                },
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    tipo: true,
                    direccion: true,
                    telefono: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            // 2. Si es CLIENTE, crear registro en tabla Cliente
            if (tipo === 'CLIENTE') {
                await tx.cliente.create({
                    data: {
                        usuarioId: nuevoUsuario.id,
                        direccion: direccion || '',
                        telefono: telefono || ''
                    }
                });
                console.log(`Registro de Cliente creado para usuario ID ${nuevoUsuario.id}`);
            }

            // 3. Si es TRABAJADOR, crear registro en tabla Trabajador
            if (tipo === 'TRABAJADOR') {
                await tx.trabajador.create({
                    data: {
                        usuarioId: nuevoUsuario.id,
                        posicion: posicion || '',
                        departamento: departamento || ''
                    }
                });
                console.log(`Registro de Trabajador creado para usuario ID ${nuevoUsuario.id}`);
            }

            return nuevoUsuario;
        });

        console.log('Usuario creado exitosamente:', resultado);
        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al crear usuario', 
            error: error.message
        });
    }
});

// Ruta para actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;
        const { nombre, email, tipo, password, direccion, telefono, posicion, departamento } = req.body;

        const userId = parseInt(id);
        
        // Buscar usuario para conocer su tipo actual
        const usuarioActual = await prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                cliente: true,
                trabajador: true
            }
        });
        
        if (!usuarioActual) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Actualización en transacción
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Preparar datos básicos del usuario para actualización
            const updateData = {
                nombre,
                email,
                tipo,
                direccion,
                telefono
            };

            // 2. Si se proporciona una nueva contraseña, actualizarla
            if (password) {
                updateData.contrasena = await bcrypt.hash(password, 10);
            }

            // 3. Actualizar el usuario base
            const usuarioActualizado = await tx.usuario.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    tipo: true,
                    direccion: true,
                    telefono: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            
            // 4. Gestionar cambio de tipo (si aplica)
            
            // Si el usuario era CLIENTE pero ahora es otro tipo, no eliminar el registro
            // pero sí actualizar sus datos si sigue siendo CLIENTE
            if (usuarioActual.cliente) {
                if (tipo === 'CLIENTE') {
                    // Actualizar datos del cliente
                    await tx.cliente.update({
                        where: { usuarioId: userId },
                        data: {
                            direccion: direccion || usuarioActual.cliente.direccion,
                            telefono: telefono || usuarioActual.cliente.telefono
                        }
                    });
                    console.log(`Actualizado cliente ID ${usuarioActual.cliente.id}`);
                }
            } else if (tipo === 'CLIENTE') {
                // Era otro tipo y ahora es CLIENTE, crear registro
                await tx.cliente.create({
                    data: {
                        usuarioId: userId,
                        direccion: direccion || '',
                        telefono: telefono || ''
                    }
                });
                console.log(`Nuevo registro de Cliente creado para usuario ID ${userId}`);
            }
            
            // Si el usuario era TRABAJADOR pero ahora es otro tipo, no eliminar el registro
            // pero sí actualizar sus datos si sigue siendo TRABAJADOR
            if (usuarioActual.trabajador) {
                if (tipo === 'TRABAJADOR') {
                    // Actualizar datos del trabajador
                    await tx.trabajador.update({
                        where: { usuarioId: userId },
                        data: {
                            posicion: posicion || usuarioActual.trabajador.posicion,
                            departamento: departamento || usuarioActual.trabajador.departamento
                        }
                    });
                    console.log(`Actualizado trabajador ID ${usuarioActual.trabajador.id}`);
                }
            } else if (tipo === 'TRABAJADOR') {
                // Era otro tipo y ahora es TRABAJADOR, crear registro
                await tx.trabajador.create({
                    data: {
                        usuarioId: userId,
                        posicion: posicion || '',
                        departamento: departamento || ''
                    }
                });
                console.log(`Nuevo registro de Trabajador creado para usuario ID ${userId}`);
            }
            
            return usuarioActualizado;
        });

        res.json(resultado);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al actualizar usuario',
            error: error.message 
        });
    }
});

// Ruta para eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;

        // No permitir eliminar al propio usuario administrador
        if (parseInt(id) === decoded.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
        }

        // En lugar de eliminar, marcar como inactivo
        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { activo: false }
        });

        res.json({ message: 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al desactivar usuario' });
    }
});

// Ruta para mostrar y actualizar el usuario administrador (temporal)
app.get('/api/admin-info', async (req, res) => {
    try {
        const adminUser = await prisma.usuario.findFirst({
            where: { tipo: 'ADMIN' },
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!adminUser) {
            return res.status(404).json({ message: 'No se encontró un usuario administrador' });
        }

        console.log('Datos del administrador:', adminUser);
        res.json(adminUser);
    } catch (error) {
        console.error('Error al obtener usuario administrador:', error);
        res.status(500).json({ message: 'Error al obtener usuario administrador' });
    }
});

app.put('/api/admin-info', async (req, res) => {
    try {
        const adminUser = await prisma.usuario.findFirst({
            where: { tipo: 'ADMIN' }
        });

        if (!adminUser) {
            return res.status(404).json({ message: 'No se encontró un usuario administrador' });
        }

        // Actualizar solo el nombre
        const updatedAdmin = await prisma.usuario.update({
            where: { id: adminUser.id },
            data: {
                nombre: req.body.nombre || adminUser.nombre
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log('Administrador actualizado:', updatedAdmin);
        res.json(updatedAdmin);
    } catch (error) {
        console.error('Error al actualizar usuario administrador:', error);
        res.status(500).json({ message: 'Error al actualizar usuario administrador' });
    }
});

// Ruta temporal para mostrar todos los usuarios (solo para depuración)
app.get('/api/debug/usuarios', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                direccion: true,
                telefono: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log('Tabla de usuarios:', usuarios);
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// Ruta para eliminar usuario FÍSICAMENTE (solo admin y con confirmación especial)
app.delete('/api/usuarios/:id/permanente', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;
        const { confirmacion } = req.body;

        // Requerir una confirmación específica
        if (confirmacion !== 'ELIMINAR_PERMANENTEMENTE') {
            return res.status(400).json({ message: 'Se requiere confirmación especial para esta acción' });
        }

        // No permitir eliminar al propio usuario administrador
        if (parseInt(id) === decoded.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
        }

        try {
            // 1. Eliminar notificaciones del usuario
            await prisma.notificacion.deleteMany({
                where: { usuarioId: parseInt(id) }
            });

            // 2. Verificar si es cliente y eliminar registros asociados
            const cliente = await prisma.cliente.findUnique({
                where: { usuarioId: parseInt(id) }
            });

            if (cliente) {
                // Eliminar facturas de órdenes del cliente
                const ordenes = await prisma.orden.findMany({
                    where: { clienteId: cliente.id }
                });

                for (const orden of ordenes) {
                    // Eliminar la factura si existe
                    await prisma.factura.deleteMany({
                        where: { ordenId: orden.id }
                    });

                    // Eliminar relaciones orden-servicio
                    await prisma.ordenServicio.deleteMany({
                        where: { ordenId: orden.id }
                    });
                }

                // Eliminar órdenes
                await prisma.orden.deleteMany({
                    where: { clienteId: cliente.id }
                });

                // Eliminar cliente
                await prisma.cliente.delete({
                    where: { id: cliente.id }
                });
            }

            // 3. Verificar si es trabajador y eliminar
            const trabajador = await prisma.trabajador.findUnique({
                where: { usuarioId: parseInt(id) }
            });

            if (trabajador) {
                await prisma.trabajador.delete({
                    where: { id: trabajador.id }
                });
            }

            // 4. Finalmente eliminar el usuario
            await prisma.usuario.delete({
                where: { id: parseInt(id) }
            });

            res.json({ message: 'Usuario eliminado permanentemente' });
        } catch (error) {
            console.error('Error en cascada:', error);
            res.status(500).json({ 
                message: 'Error al eliminar registros asociados al usuario',
                details: error.message
            });
        }
    } catch (error) {
        console.error('Error al eliminar usuario permanentemente:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al eliminar usuario permanentemente',
            details: error.message
        });
    }
});

// Ruta para reactivar usuario
app.patch('/api/usuarios/:id/reactivar', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;

        // Reactivar el usuario
        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { activo: true }
        });

        res.json({ message: 'Usuario reactivado correctamente' });
    } catch (error) {
        console.error('Error al reactivar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al reactivar usuario' });
    }
});

// Manejo de errores 404
app.use((req, res) => {
    console.log('Ruta no encontrada:', req.url);
    res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 