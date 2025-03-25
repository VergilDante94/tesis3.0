const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFService = require('../services/pdfService');

const facturaController = {
    // Generar factura para una orden
    async generar(req, res) {
        try {
            const { ordenId } = req.params;
            
            // Verificar si ya existe una factura para esta orden
            const facturaExistente = await prisma.factura.findFirst({
                where: { ordenId: parseInt(ordenId) }
            });

            if (facturaExistente) {
                return res.status(400).json({ 
                    message: 'Ya existe una factura para esta orden',
                    facturaId: facturaExistente.id
                });
            }

            // Obtener datos de la orden
            const orden = await prisma.orden.findUnique({
                where: { id: parseInt(ordenId) },
                include: {
                    cliente: {
                        include: { 
                            usuario: { select: { nombre: true, email: true, direccion: true, telefono: true } } 
                        }
                    },
                    servicios: {
                        include: { servicio: true }
                    }
                }
            });

            if (!orden) {
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            // Calcular importe total y preparar detalles
            let subtotal = 0;
            const detalles = orden.servicios.map(os => {
                const importe = os.cantidad * os.precioUnitario;
                subtotal += importe;
                return {
                    servicio: os.servicio.nombre,
                    cantidad: os.cantidad,
                    precioUnitario: os.precioUnitario,
                    importe
                };
            });

            const impuestos = subtotal * 0.16; // 16% IVA
            const total = subtotal + impuestos;

            // Generar el archivo PDF
            const pdfData = {
                numeroFactura: `FC-${Date.now()}`,
                fecha: new Date().toISOString().split('T')[0],
                cliente: {
                    nombre: orden.cliente.usuario.nombre,
                    email: orden.cliente.usuario.email,
                    direccion: orden.cliente.usuario.direccion || 'N/A',
                    telefono: orden.cliente.usuario.telefono || 'N/A'
                },
                numeroOrden: orden.id,
                detalles,
                subtotal,
                impuestos,
                total
            };

            const pdfBuffer = await PDFService.generarFacturaPDF(pdfData);
            const pdfFileName = `factura_${orden.id}_${Date.now()}.pdf`;
            
            // Guardar la factura en la base de datos
            const factura = await prisma.factura.create({
                data: {
                    ordenId: parseInt(ordenId),
                    subtotal,
                    impuestos,
                    total,
                    estado: 'PENDIENTE',
                    fechaEmision: new Date(),
                    archivoPath: `/facturas/${pdfFileName}`
                }
            });

            // Almacenar el archivo PDF (simulado)
            await PDFService.guardarPDF(pdfBuffer, pdfFileName);
            
            // Notificar al cliente sobre la factura
            try {
                // Crear notificación en la base de datos
                await prisma.notificacion.create({
                    data: {
                        usuarioId: orden.cliente.usuarioId,
                        mensaje: `Se ha generado la factura #${factura.id} para tu orden #${orden.id}`,
                        tipo: 'FACTURA',
                        entidadId: factura.id
                    }
                });
            } catch (notifError) {
                console.error('Error al enviar notificación:', notifError);
                // No detenemos el proceso por un error de notificación
            }

            // Preparar respuesta
            const respuesta = {
                message: 'Factura generada correctamente',
                facturaId: factura.id,
                ordenId: orden.id,
                pdfUrl: `/api/facturas/${factura.id}/pdf`,
                datos: pdfData
            };
            
            res.status(201).json(respuesta);
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
                        cliente: {
                            id: parseInt(clienteId)
                        }
                    }
                },
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

            // Verificar permisos (solo dueño de la factura o admin/trabajador)
            const usuarioActual = req.usuario;
            const esCliente = usuarioActual.tipo === 'CLIENTE';
            const esClienteDueño = esCliente && factura.orden.cliente.usuarioId === usuarioActual.id;
            
            if (esCliente && !esClienteDueño) {
                return res.status(403).json({ error: 'No tienes permiso para ver esta factura' });
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
    },
    
    // Listar todas las facturas (solo para admin/trabajador)
    async listarTodas(req, res) {
        try {
            // Verificar si el usuario es ADMIN o TRABAJADOR
            if (!['ADMIN', 'TRABAJADOR'].includes(req.usuario.tipo)) {
                return res.status(403).json({ error: 'No tienes permiso para ver todas las facturas' });
            }
            
            const facturas = await prisma.factura.findMany({
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
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            res.json(facturas);
        } catch (error) {
            console.error('Error al listar todas las facturas:', error);
            res.status(500).json({ error: 'Error al obtener las facturas' });
        }
    }
};

module.exports = facturaController;
