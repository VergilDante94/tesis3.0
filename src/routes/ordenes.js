const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Crear nueva orden
router.post('/', auth, async (req, res) => {
    try {
        const { clienteId, servicios, fechaProgramada, descripcion } = req.body;

        // Validar que la fecha programada no sea anterior a la fecha actual
        const fechaActual = new Date();
        const fechaSeleccionada = new Date(fechaProgramada);
        
        if (fechaSeleccionada < fechaActual) {
            return res.status(400).json({ error: 'La fecha programada no puede ser anterior a la fecha actual' });
        }

        const orden = await prisma.orden.create({
            data: {
                clienteId: parseInt(clienteId),
                estado: 'PENDIENTE',
                fechaProgramada: fechaSeleccionada,
                descripcion: descripcion || '',
                servicios: {
                    create: servicios.map(s => ({
                        servicioId: s.servicioId,
                        cantidad: s.cantidad,
                        precioUnitario: 0
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

        // Actualizar precios unitarios
        for (const ordenServicio of orden.servicios) {
            await prisma.ordenServicio.update({
                where: { id: ordenServicio.id },
                data: {
                    precioUnitario: ordenServicio.servicio.precioBase
                }
            });
        }

        // Crear notificación
        await prisma.notificacion.create({
            data: {
                usuarioId: parseInt(clienteId),
                mensaje: `Nueva orden creada #${orden.id}`,
            }
        });

        res.status(201).json(orden);
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ error: 'Error al crear orden' });
    }
});

// ... existing code ... 