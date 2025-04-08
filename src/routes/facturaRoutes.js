const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Middleware para verificar token
const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al verificar token' });
    }
};

// Obtener todas las facturas (admin ve todas, cliente ve solo las suyas)
router.get('/', verificarToken, async (req, res) => {
    try {
        let facturas;
        
        if (req.user.tipo === 'ADMIN') {
            // Admin puede ver todas las facturas
            facturas = await prisma.factura.findMany({
                include: {
                    orden: {
                        include: {
                            cliente: true
                        }
                    }
                }
            });
        } else {
            // Cliente solo ve sus facturas
            // Primero obtenemos el cliente asociado al usuario
            const cliente = await prisma.cliente.findUnique({
                where: { usuarioId: req.user.id }
            });
            
            if (!cliente) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            facturas = await prisma.factura.findMany({
                where: {
                    orden: {
                        clienteId: cliente.id
                    }
                },
                include: {
                    orden: true
                }
            });
        }
        
        res.json(facturas);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ error: 'Error al obtener las facturas' });
    }
});

// Obtener una factura por ID
router.get('/:id', verificarToken, async (req, res) => {
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
        
        // Verificar si el usuario tiene permiso para ver esta factura
        if (req.user.tipo !== 'ADMIN') {
            const cliente = await prisma.cliente.findUnique({
                where: { usuarioId: req.user.id }
            });
            
            if (!cliente || factura.orden.clienteId !== cliente.id) {
                return res.status(403).json({ error: 'No autorizado' });
            }
        }
        
        res.json(factura);
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ error: 'Error al obtener la factura' });
    }
});

// Crear una nueva factura (solo admin)
router.post('/', verificarToken, async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { ordenId, subtotal, impuestos, total, metodoPago } = req.body;
        
        // Verificar que la orden exista
        const orden = await prisma.orden.findUnique({
            where: { id: parseInt(ordenId) }
        });
        
        if (!orden) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }
        
        // Crear la factura
        const factura = await prisma.factura.create({
            data: {
                ordenId: parseInt(ordenId),
                numeroFactura: `F-${Date.now()}`, // Generar un número de factura único
                fechaEmision: new Date(),
                subtotal: parseFloat(subtotal),
                impuestos: parseFloat(impuestos),
                total: parseFloat(total),
                metodoPago: metodoPago || 'EFECTIVO'
            }
        });
        
        res.status(201).json(factura);
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({ error: 'Error al crear la factura' });
    }
});

// Ruta para descargar factura en PDF
router.get('/:id/pdf', verificarToken, async (req, res) => {
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

        // Verificar si el usuario tiene permiso para ver esta factura
        if (req.user.tipo !== 'ADMIN') {
            const cliente = await prisma.cliente.findUnique({
                where: { usuarioId: req.user.id }
            });
            
            if (!cliente || factura.orden.clienteId !== cliente.id) {
                return res.status(403).json({ error: 'No autorizado' });
            }
        }

        // Crear directorio para facturas si no existe
        const facturasDir = path.join(__dirname, '../../public/facturas');
        if (!fs.existsSync(facturasDir)) {
            fs.mkdirSync(facturasDir, { recursive: true });
        }

        // Nombre del archivo PDF usando el ID de la factura
        const fileName = `factura_${id}.pdf`;
        const filePath = path.join(facturasDir, fileName);

        // Crear el documento PDF
        const doc = new PDFDocument();
        
        // Pipe el PDF al archivo
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Agregar contenido al PDF
        doc.fontSize(20).text('FACTURA', { align: 'center' });
        doc.moveDown();
        
        // Información de la factura
        doc.fontSize(12);
        doc.text(`Número de Factura: ${factura.numeroFactura}`);
        doc.text(`Fecha de Emisión: ${new Date(factura.fechaEmision).toLocaleDateString()}`);
        doc.text(`Cliente: ${factura.orden.cliente.nombre}`);
        doc.moveDown();

        // Tabla de servicios
        doc.text('Servicios:', { underline: true });
        doc.moveDown();
        factura.orden.servicios.forEach(item => {
            doc.text(`${item.servicio.nombre}`);
            doc.text(`Cantidad: ${item.cantidad} x $${item.precioUnitario} = $${item.cantidad * item.precioUnitario}`, { indent: 20 });
        });
        doc.moveDown();

        // Totales
        doc.text('Subtotal: $' + factura.subtotal.toFixed(2));
        doc.text('Impuestos: $' + factura.impuestos.toFixed(2));
        doc.text('Total: $' + factura.total.toFixed(2), { bold: true });

        // Finalizar el PDF
        doc.end();

        // Esperar a que el archivo se escriba completamente
        writeStream.on('finish', () => {
            // Configurar headers para la descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.numeroFactura}.pdf`);
            
            // Enviar el archivo
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).json({ error: 'Error al descargar el archivo' });
                }
                
                // Eliminar el archivo después de enviarlo
                setTimeout(() => {
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Archivo temporal eliminado: ${filePath}`);
                        }
                    } catch (err) {
                        console.error('Error al eliminar archivo temporal:', err);
                    }
                }, 1000); // Esperar 1 segundo antes de eliminar
            });
        });

        writeStream.on('error', (error) => {
            console.error('Error al escribir el archivo:', error);
            res.status(500).json({ error: 'Error al generar el PDF' });
        });

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ error: 'Error al generar el PDF de la factura' });
    }
});

module.exports = router; 