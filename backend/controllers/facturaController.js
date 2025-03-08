const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFService = require('../services/pdfService');

const facturaController = {
    // Generar factura para una orden
    async generar(req, res) {
        try {
            const { ordenId } = req.params;

            // Obtener orden con servicios
            const orden = await prisma.orden.findUnique({
                where: { id: parseInt(ordenId) },
                include: {
                    servicios: {
                        include: {
                            servicio: true
                        }
                    }
                }
            });

            if (!orden) {
                return res.status(404).json({ error: 'Orden no encontrada' });
            }

            // Calcular subtotal y total
            const subtotal = orden.servicios.reduce((acc, os) => {
                return acc + (os.servicio.precioBase * os.cantidad);
            }, 0);

            const IVA = 0.16; // 16% de IVA
            const total = subtotal * (1 + IVA);

            // Crear factura
            const factura = await prisma.factura.create({
                data: {
                    ordenId: orden.id,
                    subtotal,
                    total
                },
                include: {
                    orden: {
                        include: {
                            cliente: true,
                            servicios: {
                                include: {
                                    servicio: true
                                }
                            }
                        }
                    }
                }
            });

            // Notificar al cliente
            await prisma.notificacion.create({
                data: {
                    usuarioId: orden.clienteId,
                    tipo: 'FACTURA_GENERADA',
                    mensaje: `Se ha generado la factura para tu orden #${ordenId}`
                }
            });

            res.status(201).json(factura);
        } catch (error) {
            console.error('Error al generar factura:', error);
            res.status(500).json({ error: 'Error al generar factura' });
        }
    },

    // Obtener factura por ID
    async obtener(req, res) {
        try {
            const { id } = req.params;
            const factura = await prisma.factura.findUnique({
                where: { id: parseInt(id) },
                include: {
                    orden: {
                        include: {
                            cliente: true,
                            servicios: {
                                include: {
                                    servicio: true
                                }
                            }
                        }
                    }
                }
            });

            if (!factura) {
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            res.json(factura);
        } catch (error) {
            console.error('Error al obtener factura:', error);
            res.status(500).json({ error: 'Error al obtener factura' });
        }
    },

    // Listar facturas por cliente
    async listarPorCliente(req, res) {
        try {
            const { clienteId } = req.params;
            const facturas = await prisma.factura.findMany({
                where: {
                    orden: {
                        clienteId: parseInt(clienteId)
                    }
                },
                include: {
                    orden: {
                        include: {
                            servicios: {
                                include: {
                                    servicio: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            res.json(facturas);
        } catch (error) {
            console.error('Error al listar facturas:', error);
            res.status(500).json({ error: 'Error al obtener facturas' });
        }
    },

    // Descargar PDF de una factura
    async descargarPDF(req, res) {
        try {
            const { id } = req.params;
            const factura = await prisma.factura.findUnique({
                where: { id: parseInt(id) },
                include: {
                    orden: {
                        include: {
                            cliente: {
                                include: {
                                    usuario: true
                                }
                            },
                            servicios: {
                                include: {
                                    servicio: true
                                }
                            }
                        }
                    }
                }
            });

            if (!factura) {
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            // Configurar headers para la descarga del PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.id}.pdf`);

            // Generar y enviar el PDF
            await PDFService.generarFacturaPDF(factura, res);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            res.status(500).json({ error: 'Error al generar PDF' });
        }
    }
};

module.exports = facturaController;
