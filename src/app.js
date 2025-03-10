const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.contrasena);
        if (!passwordValida) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear el objeto del token
        const tokenData = {
            id: usuario.id,
            email: usuario.email,
            tipo: usuario.tipo,
            nombre: usuario.nombre
        };

        console.log('Datos del token a enviar:', tokenData); // Para debugging

        // Convertir a base64
        const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

        // Enviar respuesta
        res.json({ 
            token,
            usuario: tokenData
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
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
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());

        const usuario = await prisma.usuario.findUnique({
            where: { id: userData.id },
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
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Rutas de servicios
app.get('/api/servicios', async (req, res) => {
    try {
        const servicios = await prisma.servicio.findMany({
            orderBy: {
                nombre: 'asc'
            }
        });
        res.json(servicios);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({ message: 'Error al obtener servicios' });
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
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());

        // Solo los administradores pueden ver la lista de usuarios
        if (userData.tipo !== 'ADMIN') {
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
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());

        if (userData.tipo !== 'ADMIN') {
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
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());

        if (userData.tipo !== 'ADMIN') {
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
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());

        if (userData.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;

        // No permitir eliminar al propio usuario administrador
        if (parseInt(id) === userData.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
        }

        await prisma.usuario.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
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
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());

        const { nombre, password } = req.body;
        const updateData = { nombre };

        // Si se proporciona una nueva contraseña, actualizarla
        if (password) {
            updateData.contrasena = await bcrypt.hash(password, 10);
        }

        const usuario = await prisma.usuario.update({
            where: { id: userData.id },
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