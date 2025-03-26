const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFService = require('../services/pdfService');
const fs = require('fs');
const path = require('path');

// Asegurar que los directorios necesarios existan
const asegurarDirectorios = () => {
    const dirs = [
        path.join(__dirname, '../../public/facturas'),
        path.join(__dirname, '../../logs')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Directorio creado: ${dir}`);
        }
    });
};

// Ejecutar al inicio
asegurarDirectorios();

const facturaController = {
    // Generar factura para una orden
    async generar(req, res) {
        try {
            const { ordenId } = req.params;
            console.log(`Iniciando generación de factura para orden ${ordenId}`);
            
            // Verificar si ya existe una factura para esta orden
            const facturaExistente = await prisma.factura.findFirst({
                where: { ordenId: parseInt(ordenId) }
            });

            if (facturaExistente) {
                console.log(`Ya existe una factura para la orden ${ordenId}`);
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
                console.log(`Orden ${ordenId} no encontrada`);
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            console.log(`Orden encontrada: ${JSON.stringify(orden, null, 2)}`);

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

            const total = subtotal;

            console.log(`Cálculos realizados - Subtotal: ${subtotal}, Total: ${total}`);

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
                total
            };

            console.log('Generando PDF con datos:', JSON.stringify(pdfData, null, 2));
            const pdfBuffer = await PDFService.generarFacturaPDF(pdfData);
            const pdfFileName = `factura_${orden.id}_${Date.now()}.pdf`;
            
            // Guardar la factura en la base de datos
            console.log('Guardando factura en la base de datos...');
            const factura = await prisma.factura.create({
                data: {
                    ordenId: parseInt(ordenId),
                    subtotal,
                    total,
                    estado: 'PENDIENTE',
                    fechaEmision: new Date(),
                    archivoPath: `/facturas/${pdfFileName}`
                }
            });

            console.log('Factura guardada en BD:', factura);

            // Almacenar el archivo PDF
            console.log('Guardando archivo PDF...');
            await PDFService.guardarPDF(pdfBuffer, pdfFileName);
            
            // Notificar al cliente sobre la factura
            try {
                console.log('Creando notificación para el cliente...');
                await prisma.notificacion.create({
                    data: {
                        usuarioId: orden.cliente.usuarioId,
                        mensaje: `Se ha generado la factura #${factura.id} para tu orden #${orden.id}`,
                        tipo: 'FACTURA',
                        entidadId: factura.id
                    }
                });
                console.log('Notificación creada exitosamente');
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
            
            console.log('Respuesta final:', JSON.stringify(respuesta, null, 2));
            res.status(201).json(respuesta);
        } catch (error) {
            console.error('Error al generar factura:', error);
            res.status(500).json({ 
                error: 'Error al generar factura',
                details: error.message
            });
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
            console.log('Buscando facturas para cliente:', clienteId);
            
            // Primero obtener el ID del cliente desde el usuario
            const cliente = await prisma.cliente.findFirst({
                where: {
                    usuarioId: parseInt(clienteId)
                }
            });

            if (!cliente) {
                console.log('Cliente no encontrado');
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            console.log('Cliente encontrado:', cliente);
            
            const facturas = await prisma.factura.findMany({
                where: {
                    orden: {
                        clienteId: cliente.id
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
                    fechaEmision: 'desc'
                }
            });

            console.log('Facturas encontradas:', facturas.length);
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
            console.log('Descargando PDF para factura:', id);

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
                console.error('Factura no encontrada:', id);
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            console.log('Preparando datos para el PDF...');
            const pdfData = {
                numeroFactura: factura.numeroFactura || `FC-${factura.id}`,
                fecha: factura.fechaEmision.toLocaleDateString(),
                cliente: {
                    nombre: factura.orden.cliente.usuario.nombre,
                    email: factura.orden.cliente.usuario.email,
                    direccion: factura.orden.cliente.usuario.direccion || 'N/A',
                    telefono: factura.orden.cliente.usuario.telefono || 'N/A'
                },
                numeroOrden: factura.ordenId,
                detalles: factura.orden.servicios.map(os => ({
                    servicio: os.servicio.nombre,
                    cantidad: os.cantidad,
                    precioUnitario: os.precioUnitario,
                    importe: os.cantidad * os.precioUnitario
                })),
                subtotal: factura.subtotal || factura.orden.servicios.reduce((sum, os) => 
                    sum + (os.cantidad * os.precioUnitario), 0),
                total: factura.total
            };

            console.log('Generando PDF con datos:', JSON.stringify(pdfData, null, 2));
            const pdfBuffer = await PDFService.generarFacturaPDF(pdfData);
            console.log('PDF generado exitosamente');

            // Configurar headers para la descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.numeroFactura || factura.id}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // Enviar el PDF
            res.send(pdfBuffer);
            console.log('PDF enviado al cliente');

        } catch (error) {
            console.error('Error al descargar PDF:', error);
            res.status(500).json({ 
                error: 'Error al generar el PDF',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },
    
    // Listar todas las facturas
    async listarTodas(req, res) {
        try {
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
                    fechaEmision: 'desc'
                }
            });

            res.json(facturas);
        } catch (error) {
            console.error('Error al listar facturas:', error);
            res.status(500).json({ error: 'Error al obtener facturas' });
        }
    }
};

module.exports = facturaController;
