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
        
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, usuario.contrasena);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

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
                tipo: usuario.tipo
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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
                tipo: true
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

// Ruta para actualizar el perfil del usuario
app.put('/api/usuarios/me', async (req, res) => {
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

        const { nombre, password } = req.body;
        const updateData = { nombre };

        // Si se proporciona una nueva contraseña, actualizarla
        if (password) {
            updateData.contrasena = await bcrypt.hash(password, 10);
        }

        const usuario = await prisma.usuario.update({
            where: { id: decoded.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                nombre: true,
                tipo: true
            }
        });

        res.json(usuario);
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al actualizar el perfil' });
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