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
                    estado: orden.estado === 'REALIZADO' || orden.estado === 'COMPLETADA' ? 'PAGADA' : 'PENDIENTE',
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
                        enlaceId: factura.id,
                        enlaceTipo: 'FACTURA',
                        estado: 'PENDIENTE'
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
            console.log(`Iniciando descarga de PDF para factura ${id}`);
            
            // Buscar la factura
            const factura = await prisma.factura.findUnique({
                where: { id: parseInt(id) },
                include: {
                    orden: {
                        include: {
                            cliente: {
                                include: { 
                                    usuario: { 
                                        select: { nombre: true, email: true, direccion: true, telefono: true } 
                                    } 
                                }
                            },
                            servicios: {
                                include: { servicio: true }
                            }
                        }
                    }
                }
            });

            if (!factura) {
                console.log(`Factura ${id} no encontrada`);
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            // Generar nombre de archivo con datos del cliente y fecha
            const clienteNombre = factura.orden?.cliente?.usuario?.nombre?.replace(/\s+/g, '_') || 'cliente';
            const fechaFactura = new Date(factura.fechaEmision).toISOString().split('T')[0];
            const nombreArchivo = `factura-${id}-${clienteNombre}-${fechaFactura}.pdf`;
            
            // Verificar si existe el archivo previamente generado
            const pdfPath = path.join(__dirname, '../../public', factura.archivoPath);
            if (fs.existsSync(pdfPath)) {
                console.log(`Archivo PDF encontrado: ${pdfPath}`);
                
                // Configurar encabezados para descargar el archivo
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
                
                // Enviar el archivo al cliente
                return fs.createReadStream(pdfPath).pipe(res);
            }

            console.log('Archivo PDF no encontrado, generando uno nuevo...');

            // Si no existe, generar el PDF
            const orden = factura.orden;
            if (!orden) {
                console.log('Orden no encontrada para la factura');
                return res.status(404).json({ error: 'Orden no encontrada para la factura' });
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

            const total = subtotal;

            // Generar el archivo PDF
            const pdfData = {
                numeroFactura: `FC-${factura.id}`,
                fecha: new Date(factura.fechaEmision).toISOString().split('T')[0],
                cliente: {
                    nombre: orden.cliente?.usuario?.nombre || 'N/A',
                    email: orden.cliente?.usuario?.email || 'N/A',
                    direccion: orden.cliente?.usuario?.direccion || 'N/A',
                    telefono: orden.cliente?.usuario?.telefono || 'N/A'
                },
                numeroOrden: orden.id,
                detalles,
                subtotal,
                total
            };

            console.log('Generando nuevo PDF con datos:', JSON.stringify(pdfData, null, 2));
            const pdfBuffer = await PDFService.generarFacturaPDF(pdfData);
            
            // Configurar encabezados para descargar el archivo
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            
            // Enviar el buffer al cliente
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error al descargar factura PDF:', error);
            res.status(500).json({ error: 'Error al generar PDF: ' + error.message });
        }
    },
    
    // Nueva función para descargar PDF usando token en URL
    async descargarPDFConToken(req, res) {
        try {
            const { id } = req.params;
            const { token } = req.query;
            
            console.log(`Iniciando descarga directa de PDF para factura ${id} con token en URL`);
            
            // Verificar el token
            if (!token) {
                return res.status(401).json({ error: 'Token no proporcionado' });
            }
            
            // Aquí normalmente validarías el token, por simplicidad asumimos que es válido
            // En una implementación completa, deberías validar el token
            
            // Buscar la factura
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
                                include: { servicio: true }
                            }
                        }
                    }
                }
            });

            if (!factura) {
                console.log(`Factura ${id} no encontrada`);
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            // Generar nombre de archivo con datos del cliente y fecha
            const clienteNombre = factura.orden?.cliente?.usuario?.nombre?.replace(/\s+/g, '_') || 'cliente';
            const fechaFactura = new Date(factura.fechaEmision).toISOString().split('T')[0];
            const nombreArchivo = `factura-${id}-${clienteNombre}-${fechaFactura}.pdf`;
            
            // Verificar si existe el archivo previamente generado
            const pdfPath = path.join(__dirname, '../../public', factura.archivoPath);
            if (fs.existsSync(pdfPath)) {
                console.log(`Archivo PDF encontrado: ${pdfPath}`);
                
                // Configurar encabezados para descargar el archivo
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
                
                // Enviar el archivo al cliente
                return fs.createReadStream(pdfPath).pipe(res);
            }

            console.log('Archivo PDF no encontrado, generando uno nuevo...');
            
            // Si no existe, generar el PDF
            const orden = factura.orden;
            if (!orden) {
                console.log('Orden no encontrada para la factura');
                return res.status(404).json({ error: 'Orden no encontrada para la factura' });
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

            const total = subtotal;

            // Generar el archivo PDF
            const pdfData = {
                numeroFactura: `FC-${factura.id}`,
                fecha: new Date(factura.fechaEmision).toISOString().split('T')[0],
                cliente: {
                    nombre: orden.cliente?.usuario?.nombre || 'N/A',
                    email: orden.cliente?.usuario?.email || 'N/A',
                    direccion: orden.cliente?.usuario?.direccion || 'N/A',
                    telefono: orden.cliente?.usuario?.telefono || 'N/A'
                },
                numeroOrden: orden.id,
                detalles,
                subtotal,
                total
            };

            console.log('Generando nuevo PDF con datos:', JSON.stringify(pdfData, null, 2));
            const pdfBuffer = await PDFService.generarFacturaPDF(pdfData);
            
            // Guardar el PDF para futuras descargas
            const pdfFileName = `factura_${orden.id}_${Date.now()}.pdf`;
            const savePath = path.join(__dirname, '../../public/facturas', pdfFileName);
            fs.writeFileSync(savePath, pdfBuffer);
            
            // Actualizar la ruta en la base de datos
            await prisma.factura.update({
                where: { id: parseInt(id) },
                data: { archivoPath: `/facturas/${pdfFileName}` }
            });
            
            // Configurar encabezados para descargar el archivo
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // Enviar el buffer al cliente
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error al descargar factura PDF con token:', error);
            res.status(500).json({ error: 'Error al generar PDF: ' + error.message });
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
    },

    // Sincronizar facturas con estados de órdenes
    async sincronizarEstadosFacturas(req, res) {
        try {
            console.log('Iniciando sincronización de estados de facturas con órdenes');
            
            // Obtener todas las facturas
            const facturas = await prisma.factura.findMany({
                include: {
                    orden: true
                }
            });
            
            let actualizadas = 0;
            let errores = 0;
            
            // Actualizar estado de cada factura basado en su orden
            for (const factura of facturas) {
                try {
                    if (!factura.orden) {
                        console.log(`Factura ${factura.id}: No se encontró la orden asociada`);
                        continue;
                    }
                    
                    let nuevoEstado = factura.estado;
                    
                    // Asignar estado según el estado de la orden
                    if (factura.orden.estado === 'REALIZADO' || factura.orden.estado === 'COMPLETADA') {
                        nuevoEstado = 'PAGADA';
                    } else if (factura.orden.estado === 'CANCELADA') {
                        nuevoEstado = 'CANCELADA';
                    } else {
                        nuevoEstado = 'PENDIENTE';
                    }
                    
                    // Solo actualizar si el estado cambió
                    if (nuevoEstado !== factura.estado) {
                        await prisma.factura.update({
                            where: { id: factura.id },
                            data: { estado: nuevoEstado }
                        });
                        console.log(`Factura ${factura.id} actualizada: ${factura.estado} → ${nuevoEstado}`);
                        actualizadas++;
                    }
                } catch (error) {
                    console.error(`Error al procesar factura ${factura.id}:`, error);
                    errores++;
                }
            }
            
            console.log(`Sincronización completada: ${actualizadas} facturas actualizadas, ${errores} errores`);
            
            res.json({
                mensaje: 'Sincronización de estados completada',
                actualizadas,
                errores,
                total: facturas.length
            });
        } catch (error) {
            console.error('Error en sincronización de facturas:', error);
            res.status(500).json({ error: 'Error al sincronizar estados de facturas' });
        }
    },

    // Actualizar el total de una factura
    async actualizarTotal(req, res) {
        try {
            const { id } = req.params;
            const { total } = req.body;

            if (!total || total <= 0) {
                return res.status(400).json({ message: 'El total debe ser un número positivo' });
            }

            // Buscar la factura
            const factura = await prisma.factura.findUnique({
                where: { id: parseInt(id) }
            });

            if (!factura) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            // Actualizar el total (y subtotal si es necesario)
            const facturaActualizada = await prisma.factura.update({
                where: { id: parseInt(id) },
                data: {
                    total: parseFloat(total),
                    subtotal: parseFloat(total) // También actualizamos el subtotal
                }
            });

            // Intentar actualizar el PDF si existe
            try {
                if (factura.archivoPath) {
                    // Buscar datos completos para regenerar el PDF
                    const facturaCompleta = await prisma.factura.findUnique({
                        where: { id: parseInt(id) },
                        include: {
                            orden: {
                                include: {
                                    cliente: {
                                        include: { 
                                            usuario: { 
                                                select: { nombre: true, email: true, direccion: true, telefono: true } 
                                            } 
                                        }
                                    },
                                    servicios: {
                                        include: { servicio: true }
                                    }
                                }
                            }
                        }
                    });
                    
                    // Preparar datos para el PDF
                    const detalles = facturaCompleta.orden.servicios.map(os => ({
                        servicio: os.servicio.nombre,
                        cantidad: os.cantidad,
                        precioUnitario: os.precioUnitario,
                        importe: os.cantidad * os.precioUnitario
                    }));
                    
                    // Si no hay detalles (compra), crear uno genérico
                    if (detalles.length === 0) {
                        detalles.push({
                            servicio: 'Productos',
                            cantidad: 1,
                            precioUnitario: total,
                            importe: total
                        });
                    }
                    
                    const pdfData = {
                        numeroFactura: `FC-${facturaCompleta.id}`,
                        fecha: new Date(facturaCompleta.fechaEmision).toISOString().split('T')[0],
                        cliente: {
                            nombre: facturaCompleta.orden.cliente.usuario.nombre,
                            email: facturaCompleta.orden.cliente.usuario.email,
                            direccion: facturaCompleta.orden.cliente.usuario.direccion || 'N/A',
                            telefono: facturaCompleta.orden.cliente.usuario.telefono || 'N/A'
                        },
                        numeroOrden: facturaCompleta.orden.id,
                        detalles,
                        subtotal: parseFloat(total),
                        total: parseFloat(total)
                    };
                    
                    // Regenerar el PDF
                    const pdfBuffer = await PDFService.generarFacturaPDF(pdfData);
                    const pdfFileName = path.basename(factura.archivoPath);
                    
                    // Guardar el PDF actualizado
                    await PDFService.guardarPDF(pdfBuffer, pdfFileName);
                }
            } catch (pdfError) {
                console.error('Error al actualizar el PDF de la factura:', pdfError);
                // No interrumpimos el proceso por un error en la actualización del PDF
            }

            res.json({
                message: 'Total de factura actualizado correctamente',
                factura: facturaActualizada
            });
        } catch (error) {
            console.error('Error al actualizar el total de la factura:', error);
            res.status(500).json({ 
                message: 'Error al actualizar el total de la factura',
                error: error.message
            });
        }
    },

    // Eliminar una factura
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            console.log(`Iniciando eliminación de factura ${id}`);

            // Verificar si la factura existe
            const factura = await prisma.factura.findUnique({
                where: { id: parseInt(id) }
            });

            if (!factura) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            // Guardar la ruta del archivo para eliminarlo después
            const archivoPath = factura.archivoPath;

            // Eliminar la factura de la base de datos
            await prisma.factura.delete({
                where: { id: parseInt(id) }
            });

            // Eliminar el archivo PDF si existe
            if (archivoPath) {
                const pdfPath = path.join(__dirname, '../../public', archivoPath);
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                    console.log(`Archivo PDF eliminado: ${pdfPath}`);
                }
            }

            console.log(`Factura ${id} eliminada correctamente`);
            res.json({ message: 'Factura eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar factura:', error);
            res.status(500).json({
                message: 'Error al eliminar la factura',
                error: error.message
            });
        }
    }
};

module.exports = facturaController;
