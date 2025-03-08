const PDFDocument = require('pdfkit');

class PDFService {
    static async generarFacturaPDF(factura, stream) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50
                });

                doc.pipe(stream);

                // Encabezado
                doc.fontSize(20).text('EICMAPRI', { align: 'center' });
                doc.moveDown();
                doc.fontSize(16).text('Factura de Servicios', { align: 'center' });
                doc.moveDown();

                // Información de la factura
                doc.fontSize(12);
                doc.text(`Factura #: ${factura.id}`);
                doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString()}`);
                doc.text(`Orden #: ${factura.orden.id}`);
                doc.moveDown();

                // Información del cliente
                doc.text('Cliente:');
                doc.text(`Nombre: ${factura.orden.cliente.usuario.nombre}`);
                doc.text(`Dirección: ${factura.orden.cliente.direccion}`);
                doc.text(`Teléfono: ${factura.orden.cliente.telefono}`);
                doc.moveDown();

                // Tabla de servicios
                doc.text('Servicios:', { underline: true });
                doc.moveDown();

                // Encabezados de la tabla
                const startX = 50;
                let currentY = doc.y;

                doc.text('Servicio', startX, currentY);
                doc.text('Cantidad', 300, currentY);
                doc.text('Precio', 400, currentY);
                doc.text('Total', 500, currentY);

                doc.moveDown();
                currentY = doc.y;

                // Contenido de la tabla
                factura.orden.servicios.forEach(servicio => {
                    const subtotal = servicio.servicio.precioBase * servicio.cantidad;
                    
                    doc.text(servicio.servicio.nombre, startX, currentY);
                    doc.text(servicio.cantidad.toString(), 300, currentY);
                    doc.text(`$${servicio.servicio.precioBase.toFixed(2)}`, 400, currentY);
                    doc.text(`$${subtotal.toFixed(2)}`, 500, currentY);
                    
                    currentY += 20;
                });

                // Línea separadora
                doc.moveDown();
                doc.moveTo(startX, currentY)
                   .lineTo(550, currentY)
                   .stroke();
                
                currentY += 20;

                // Totales
                doc.text('Subtotal:', 400, currentY);
                doc.text(`$${factura.subtotal.toFixed(2)}`, 500, currentY);
                
                currentY += 20;
                doc.text('IVA (16%):', 400, currentY);
                doc.text(`$${(factura.total - factura.subtotal).toFixed(2)}`, 500, currentY);
                
                currentY += 20;
                doc.font('Helvetica-Bold')
                   .text('Total:', 400, currentY)
                   .text(`$${factura.total.toFixed(2)}`, 500, currentY);

                // Pie de página
                doc.fontSize(10)
                   .text(
                       'Esta es una factura generada electrónicamente.',
                       50,
                       doc.page.height - 50,
                       { align: 'center' }
                   );

                doc.end();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFService;
