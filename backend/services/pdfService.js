/**
 * Servicio para generar y manejar archivos PDF de facturas
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDFService = {
    /**
     * Genera un PDF para una factura
     * @param {Object} data - Datos para generar la factura
     * @returns {Promise<Buffer>} - Buffer con el contenido del PDF
     */
    async generarFacturaPDF(data) {
        console.log('Generando PDF para factura con datos:', JSON.stringify(data, null, 2));
        
        return new Promise((resolve, reject) => {
            try {
                console.log('Creando nuevo documento PDF...');
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50
                });
                
                const chunks = [];
                
                // Recolectar chunks del PDF
                doc.on('data', chunk => {
                    chunks.push(chunk);
                    console.log('Chunk de PDF generado');
                });
                
                doc.on('end', () => {
                    console.log('Finalizando generación de PDF...');
                    const result = Buffer.concat(chunks);
                    console.log('PDF generado exitosamente');
                    resolve(result);
                });
                
                doc.on('error', (error) => {
                    console.error('Error en la generación del PDF:', error);
                    reject(error);
                });
                
                // Encabezado
                console.log('Generando encabezado...');
                doc.fontSize(20)
                   .text('FACTURA', { align: 'center' })
                   .moveDown();
                
                doc.fontSize(12)
                   .text(`Número: ${data.numeroFactura}`)
                   .text(`Fecha: ${data.fecha}`)
                   .moveDown();
                
                // Información del cliente
                console.log('Generando información del cliente...');
                doc.fontSize(14)
                   .text('CLIENTE', { underline: true })
                   .moveDown();
                
                doc.fontSize(12)
                   .text(data.cliente.nombre)
                   .text(data.cliente.email)
                   .text(data.cliente.direccion)
                   .text(data.cliente.telefono)
                   .moveDown();
                
                // Detalles de la orden
                console.log('Generando detalles de la orden...');
                doc.fontSize(14)
                   .text(`ORDEN #${data.numeroOrden}`, { underline: true })
                   .moveDown();
                
                // Tabla de detalles
                let y = doc.y;
                doc.fontSize(10)
                   .text('Servicio', 50, y)
                   .text('Cantidad', 250, y)
                   .text('Precio', 350, y)
                   .text('Importe', 450, y)
                   .moveDown();
                
                // Línea separadora
                doc.moveTo(50, doc.y)
                   .lineTo(550, doc.y)
                   .stroke();
                
                // Detalles de servicios
                console.log('Generando detalles de servicios...');
                data.detalles.forEach(detalle => {
                    y = doc.y + 10;
                    doc.text(detalle.servicio, 50, y)
                       .text(detalle.cantidad.toString(), 250, y)
                       .text(`$${detalle.precioUnitario.toFixed(2)}`, 350, y)
                       .text(`$${detalle.importe.toFixed(2)}`, 450, y);
                });
                
                // Totales
                console.log('Generando totales...');
                y = doc.y + 20;
                doc.moveTo(50, y)
                   .lineTo(550, y)
                   .stroke();
                
                y += 10;
                doc.text('Subtotal:', 350, y)
                   .text(`$${(data.subtotal || 0).toFixed(2)}`, 450, y);
                
                y += 20;
                doc.fontSize(14)
                   .text('TOTAL:', 350, y)
                   .text(`$${(data.total || 0).toFixed(2)}`, 450, y);
                
                // Finalizar el PDF
                console.log('Finalizando documento PDF...');
                doc.end();
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                reject(error);
            }
        });
    },
    
    /**
     * Guarda un PDF en el sistema de archivos
     * @param {Buffer} pdfBuffer - Buffer con el contenido del PDF
     * @param {String} fileName - Nombre del archivo
     * @returns {Promise<String>} - Nombre del archivo guardado
     */
    async guardarPDF(pdfBuffer, fileName) {
        try {
            console.log(`Guardando PDF con nombre ${fileName}`);
            
            // Directorio para almacenar facturas
            const dir = path.join(__dirname, '../../public/facturas');
            
            // Crear directorio si no existe
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Directorio creado: ${dir}`);
            }
            
            // Guardar archivo
            const filePath = path.join(dir, fileName);
            fs.writeFileSync(filePath, pdfBuffer);
            console.log(`PDF guardado en: ${filePath}`);
            
            return fileName;
        } catch (error) {
            console.error('Error al guardar PDF:', error);
            throw error;
        }
    }
};

module.exports = PDFService;
