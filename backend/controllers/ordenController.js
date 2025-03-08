const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ordenController = {
    // Crear nueva orden
    async crear(req, res) {
        try {
            const { clienteId, servicios, descripcion, fechaProgramada } = req.body;

            const orden = await prisma.orden.create({
                data: {
                    clienteId,
                    descripcion,
                    fechaProgramada,
                    servicios: {
                        create: servicios.map(s => ({
                            servicioId: s.servicioId,
                            cantidad: s.cantidad,
                            observaciones: s.observaciones
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

            // Crear notificación de nueva orden
            await prisma.notificacion.create({
                data: {
                    usuarioId: clienteId,
                    tipo: 'ORDEN_CREADA',
                    mensaje: `Nueva orden creada #${orden.id}`,
                }
            });

            res.status(201).json(orden);
        } catch (error) {
            console.error('Error al crear orden:', error);
            res.status(500).json({ error: 'Error al crear orden' });
        }
    },

    // Asignar trabajador a orden
    async asignarTrabajador(req, res) {
        try {
            const { ordenId } = req.params;
            const { trabajadorId } = req.body;

            const orden = await prisma.orden.update({
                where: { id: parseInt(ordenId) },
                data: {
                    trabajadorId,
                    estado: 'PROGRAMADA'
                },
                include: {
                    trabajador: true
                }
            });

            // Notificar al trabajador
            await prisma.notificacion.create({
                data: {
                    usuarioId: trabajadorId,
                    tipo: 'ORDEN_ASIGNADA',
                    mensaje: `Se te ha asignado la orden #${ordenId}`
                }
            });

            res.json(orden);
        } catch (error) {
            console.error('Error al asignar trabajador:', error);
            res.status(500).json({ error: 'Error al asignar trabajador' });
        }
    },

    // Actualizar estado de orden
    async actualizarEstado(req, res) {
        try {
            const { ordenId } = req.params;
            const { estado } = req.body;

            const orden = await prisma.orden.update({
                where: { id: parseInt(ordenId) },
                data: { estado },
                include: {
                    cliente: true,
                    trabajador: true
                }
            });

            // Notificar al cliente
            await prisma.notificacion.create({
                data: {
                    usuarioId: orden.clienteId,
                    tipo: 'ACTUALIZACION_ORDEN',
                    mensaje: `Tu orden #${ordenId} ha cambiado a estado: ${estado}`
                }
            });

            res.json(orden);
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            res.status(500).json({ error: 'Error al actualizar estado' });
        }
    },

    // Listar órdenes con filtros
    async listar(req, res) {
        try {
            const { estado, clienteId, trabajadorId } = req.query;
            
            const filtros = {};
            if (estado) filtros.estado = estado;
            if (clienteId) filtros.clienteId = parseInt(clienteId);
            if (trabajadorId) filtros.trabajadorId = parseInt(trabajadorId);

            const ordenes = await prisma.orden.findMany({
                where: filtros,
                include: {
                    cliente: true,
                    trabajador: true,
                    servicios: {
                        include: {
                            servicio: true
                        }
                    }
                },
                orderBy: {
                    fechaCreacion: 'desc'
                }
            });

            res.json(ordenes);
        } catch (error) {
            console.error('Error al listar órdenes:', error);
            res.status(500).json({ error: 'Error al obtener órdenes' });
        }
    }
};

module.exports = ordenController;
