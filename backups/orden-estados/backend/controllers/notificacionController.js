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
    }
};

module.exports = notificacionController;
