const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        const jwt = require('jsonwebtoken');
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

// Obtener todos los servicios
router.get('/', async (req, res) => {
    try {
        const servicios = await prisma.servicio.findMany();
        res.json(servicios);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({ error: 'Error al obtener los servicios' });
    }
});

// Obtener un servicio por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await prisma.servicio.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        res.json(servicio);
    } catch (error) {
        console.error('Error al obtener servicio:', error);
        res.status(500).json({ error: 'Error al obtener el servicio' });
    }
});

// Crear un nuevo servicio (solo admin)
router.post('/', verificarToken, async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { nombre, descripcion, precio, categoria } = req.body;
        const servicio = await prisma.servicio.create({
            data: {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                categoria
            }
        });
        
        res.status(201).json(servicio);
    } catch (error) {
        console.error('Error al crear servicio:', error);
        res.status(500).json({ error: 'Error al crear el servicio' });
    }
});

// Actualizar un servicio (solo admin)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { id } = req.params;
        const { nombre, descripcion, precio, categoria } = req.body;
        
        const servicio = await prisma.servicio.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                categoria
            }
        });
        
        res.json(servicio);
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({ error: 'Error al actualizar el servicio' });
    }
});

// Eliminar un servicio (solo admin)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { id } = req.params;
        
        await prisma.servicio.delete({
            where: { id: parseInt(id) }
        });
        
        res.json({ message: 'Servicio eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        res.status(500).json({ error: 'Error al eliminar el servicio' });
    }
});

module.exports = router; 