const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const servicioController = {
    // Crear nuevo servicio
    async crear(req, res) {
        try {
            const { nombre, descripcion, precioBase } = req.body;
            const servicio = await prisma.servicio.create({
                data: {
                    nombre,
                    descripcion,
                    precioBase
                }
            });
            res.status(201).json(servicio);
        } catch (error) {
            console.error('Error al crear servicio:', error);
            res.status(500).json({ error: 'Error al crear servicio' });
        }
    },

    // Obtener todos los servicios
    async listar(req, res) {
        try {
            const servicios = await prisma.servicio.findMany();
            res.json(servicios);
        } catch (error) {
            console.error('Error al listar servicios:', error);
            res.status(500).json({ error: 'Error al listar servicios' });
        }
    },

    // Obtener servicio por ID
    async obtener(req, res) {
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
            res.status(500).json({ error: 'Error al obtener servicio' });
        }
    },

    // Actualizar servicio
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, precioBase } = req.body;
            const servicio = await prisma.servicio.update({
                where: { id: parseInt(id) },
                data: {
                    nombre,
                    descripcion,
                    precioBase
                }
            });
            res.json(servicio);
        } catch (error) {
            console.error('Error al actualizar servicio:', error);
            res.status(500).json({ error: 'Error al actualizar servicio' });
        }
    },

    // Eliminar servicio
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await prisma.servicio.delete({
                where: { id: parseInt(id) }
            });
            res.json({ message: 'Servicio eliminado exitosamente' });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            res.status(500).json({ error: 'Error al eliminar servicio' });
        }
    }
};

module.exports = servicioController;
