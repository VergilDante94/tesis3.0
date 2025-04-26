const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const notificacionController = {
    // Obtener notificaciones de un usuario
    async obtenerPorUsuario(req, res) {
        try {
            const { usuarioId } = req.params;
            const notificaciones = await prisma.notificacion.findMany({
                where: {
                    usuarioId: parseInt(usuarioId)
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            res.json(notificaciones);
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            res.status(500).json({ error: 'Error al obtener notificaciones' });
        }
    },

    // Marcar notificación como leída
    async marcarComoLeida(req, res) {
        try {
            const { id } = req.params;
            const notificacion = await prisma.notificacion.update({
                where: { id: parseInt(id) },
                data: {
                    estado: 'LEIDA'
                }
            });

            res.json(notificacion);
        } catch (error) {
            console.error('Error al actualizar notificación:', error);
            res.status(500).json({ error: 'Error al actualizar notificación' });
        }
    },

    // Marcar todas las notificaciones como leídas
    async marcarTodasComoLeidas(req, res) {
        try {
            const { usuarioId } = req.params;
            await prisma.notificacion.updateMany({
                where: {
                    usuarioId: parseInt(usuarioId),
                    estado: 'PENDIENTE'
                },
                data: {
                    estado: 'LEIDA'
                }
            });

            res.json({ message: 'Todas las notificaciones marcadas como leídas' });
        } catch (error) {
            console.error('Error al actualizar notificaciones:', error);
            res.status(500).json({ error: 'Error al actualizar notificaciones' });
        }
    },
    
    // Crear una nueva notificación
    async crear(req, res) {
        try {
            const { usuarioId, tipo, mensaje, enlaceId, enlaceTipo } = req.body;
            
            if (!usuarioId || !tipo || !mensaje) {
                return res.status(400).json({ 
                    error: 'Faltan datos obligatorios (usuarioId, tipo, mensaje)' 
                });
            }
            
            const notificacion = await prisma.notificacion.create({
                data: {
                    usuarioId: parseInt(usuarioId),
                    tipo,
                    mensaje,
                    estado: 'PENDIENTE',
                    enlaceId: enlaceId ? parseInt(enlaceId) : null,
                    enlaceTipo: enlaceTipo || null
                }
            });
            
            res.status(201).json(notificacion);
        } catch (error) {
            console.error('Error al crear notificación:', error);
            res.status(500).json({ error: 'Error al crear la notificación' });
        }
    },
    
    // Eliminar una notificación
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await prisma.notificacion.delete({
                where: { id: parseInt(id) }
            });
            
            res.json({ message: 'Notificación eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            res.status(500).json({ error: 'Error al eliminar la notificación' });
        }
    },
    
    // Crear notificación para todos los administradores
    async notificarAdmins(req, res) {
        try {
            const { tipo, mensaje, enlaceId, enlaceTipo } = req.body;
            
            if (!tipo || !mensaje) {
                return res.status(400).json({ 
                    error: 'Faltan datos obligatorios (tipo, mensaje)' 
                });
            }
            
            // Obtener todos los usuarios admin
            const admins = await prisma.usuario.findMany({
                where: {
                    tipo: 'ADMIN',
                    activo: true
                }
            });
            
            // Crear notificación para cada admin
            const notificaciones = [];
            for (const admin of admins) {
                const notificacion = await prisma.notificacion.create({
                    data: {
                        usuarioId: admin.id,
                        tipo,
                        mensaje,
                        estado: 'PENDIENTE',
                        enlaceId: enlaceId ? parseInt(enlaceId) : null,
                        enlaceTipo: enlaceTipo || null
                    }
                });
                notificaciones.push(notificacion);
            }
            
            res.status(201).json({ 
                message: `Notificación enviada a ${notificaciones.length} administradores`, 
                notificaciones 
            });
        } catch (error) {
            console.error('Error al notificar administradores:', error);
            res.status(500).json({ error: 'Error al enviar notificaciones' });
        }
    },
    
    // Contar notificaciones no leídas de un usuario
    async contarNoLeidas(req, res) {
        try {
            const { usuarioId } = req.params;
            const count = await prisma.notificacion.count({
                where: {
                    usuarioId: parseInt(usuarioId),
                    estado: 'PENDIENTE'
                }
            });
            
            res.json({ count });
        } catch (error) {
            console.error('Error al contar notificaciones:', error);
            res.status(500).json({ error: 'Error al contar notificaciones' });
        }
    }
};

module.exports = notificacionController;
