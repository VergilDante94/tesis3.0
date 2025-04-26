const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ordenController = {
    // Crear nueva orden
    async crear(req, res) {
        try {
            const { clienteId: usuarioId, servicios, fechaProgramada, descripcion } = req.body;

            // Buscar el cliente asociado al usuario
            const cliente = await prisma.cliente.findUnique({
                where: { usuarioId: parseInt(usuarioId) }
            });

            if (!cliente) {
                return res.status(404).json({ error: 'Cliente no encontrado para este usuario' });
            }

            // Preparar la data para crear la orden
            const ordenData = {
                clienteId: cliente.id, // Usar el ID real del cliente
                estado: 'PENDIENTE', // Establecer estado inicial
                descripcion: descripcion || null,
                servicios: {
                    create: servicios.map(s => ({
                        servicioId: s.servicioId,
                        cantidad: s.cantidad,
                        precioUnitario: 0 // Será actualizado después
                    }))
                }
            };

            // Si se proporciona fechaProgramada, añadirla a los datos
            if (fechaProgramada) {
                ordenData.fechaProgramada = new Date(fechaProgramada);
            }

            const orden = await prisma.orden.create({
                data: ordenData,
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
                    usuarioId: usuarioId,
                    tipo: 'ORDEN',
                    mensaje: `Nueva orden creada #${orden.id}`,
                    enlaceId: orden.id,
                    enlaceTipo: 'ORDEN'
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
                    tipo: 'ORDEN',
                    mensaje: `Se te ha asignado la orden #${ordenId}`,
                    enlaceId: parseInt(ordenId),
                    enlaceTipo: 'ORDEN'
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
                    usuarioId: orden.cliente.usuarioId,
                    tipo: 'ORDEN',
                    mensaje: `Tu orden #${ordenId} ha cambiado a estado: ${estado}`,
                    enlaceId: parseInt(ordenId),
                    enlaceTipo: 'ORDEN'
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
                    fecha: 'desc'
                }
            });

            res.json(ordenes);
        } catch (error) {
            console.error('Error al listar órdenes:', error);
            res.status(500).json({ error: 'Error al obtener órdenes' });
        }
    },
    
    // Cancelar orden
    async cancelarOrden(req, res) {
        try {
            const { ordenId } = req.params;
            
            // Primero verificar que la orden exista y no esté ya cancelada o completada
            const ordenExistente = await prisma.orden.findUnique({
                where: { id: parseInt(ordenId) },
                include: { cliente: true }
            });
            
            if (!ordenExistente) {
                return res.status(404).json({ error: 'Orden no encontrada' });
            }
            
            if (ordenExistente.estado === 'CANCELADA') {
                return res.status(400).json({ error: 'La orden ya está cancelada' });
            }
            
            if (ordenExistente.estado === 'COMPLETADA') {
                return res.status(400).json({ error: 'No se puede cancelar una orden completada' });
            }
            
            // Actualizar la orden a estado CANCELADA
            const orden = await prisma.orden.update({
                where: { id: parseInt(ordenId) },
                data: { estado: 'CANCELADA' },
                include: {
                    cliente: true,
                    servicios: {
                        include: {
                            servicio: true
                        }
                    }
                }
            });
            
            // Crear notificación para el cliente
            await prisma.notificacion.create({
                data: {
                    usuarioId: orden.cliente.usuarioId,
                    tipo: 'ORDEN',
                    mensaje: `Tu orden #${ordenId} ha sido cancelada`,
                    enlaceId: parseInt(ordenId),
                    enlaceTipo: 'ORDEN'
                }
            });
            
            res.json({ mensaje: 'Orden cancelada exitosamente', orden });
        } catch (error) {
            console.error('Error al cancelar orden:', error);
            res.status(500).json({ error: 'Error al cancelar la orden' });
        }
    }
};

module.exports = ordenController;
