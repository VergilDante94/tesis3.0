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
        const { nombre, direccion, telefono, password } = req.body;
        const userId = req.user.id;

        // Verificar que el usuario sea administrador
        const user = await prisma.usuario.findUnique({
            where: { id: userId }
        });

        if (!user || user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Solo los administradores pueden modificar su perfil' });
        }

        // Construir objeto de actualización
        const updateData = {
            nombre,
            direccion,
            telefono
        };

        // Si se proporciona una nueva contraseña, actualizarla
        if (password) {
            updateData.contrasena = await bcrypt.hash(password, 10);
        }

        console.log('Actualizando perfil con datos:', updateData);

        // Actualizar el usuario
        const updatedUser = await prisma.usuario.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                nombre: true,
                tipo: true,
                direccion: true,
                telefono: true
            }
        });

        console.log('Perfil actualizado:', updatedUser);

        res.json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
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
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
});

// Rutas de usuarios
app.get('/api/usuarios', async (req, res) => {
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

        // Solo los administradores pueden ver la lista de usuarios
        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al obtener usuarios' });
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

        const { nombre, email, tipo, password } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const usuario = await prisma.usuario.create({
            data: {
                nombre,
                email,
                tipo,
                contrasena: hashedPassword
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

        res.status(201).json(usuario);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al crear usuario' });
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
        const { nombre, email, tipo, password } = req.body;

        const updateData = {
            nombre,
            email,
            tipo
        };

        // Si se proporciona una nueva contraseña, actualizarla
        if (password) {
            updateData.contrasena = await bcrypt.hash(password, 10);
        }

        const usuario = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(usuario);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al actualizar usuario' });
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

        await prisma.usuario.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al eliminar usuario' });
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
                direccion: true,
                telefono: true,
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

        // Actualizar sin valores predeterminados
        const updatedAdmin = await prisma.usuario.update({
            where: { id: adminUser.id },
            data: {
                direccion: req.body.direccion,
                telefono: req.body.telefono
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

        console.log('Administrador actualizado sin valores predeterminados:', updatedAdmin);
        res.json(updatedAdmin);
    } catch (error) {
        console.error('Error al actualizar usuario administrador:', error);
        res.status(500).json({ message: 'Error al actualizar usuario administrador' });
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