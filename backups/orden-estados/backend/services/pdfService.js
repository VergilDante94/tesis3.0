/**
 * Servicio para generar y manejar archivos PDF de facturas
 */
const fs = require('fs');
const path = require('path');

const PDFService = {
    /**
     * Genera un PDF para una factura
     * @param {Object} data - Datos para generar la factura
     * @returns {Buffer} - Buffer con el contenido del PDF
     */
    async generarFacturaPDF(data) {
        console.log('Generando PDF para factura con datos:', JSON.stringify(data, null, 2));
        
        // Este es un servicio simplificado que simula la generación de PDF
        // En una implementación real, aquí se usaría una biblioteca como PDFKit
        
        // Simular un buffer de PDF
        const pdfContent = `
        =======================================
        FACTURA #${data.numeroFactura}
        Fecha: ${data.fecha}
        =======================================
        
        CLIENTE:
        ${data.cliente.nombre}
        ${data.cliente.email}
        ${data.cliente.direccion}
        ${data.cliente.telefono}
        
        ORDEN #${data.numeroOrden}
        
        DETALLES:
        ${data.detalles.map(d => `${d.servicio} x ${d.cantidad} @ ${d.precioUnitario} = ${d.importe}`).join('\n')}
        
        --------------------------------------
        Subtotal: ${data.subtotal}
        Impuestos: ${data.impuestos}
        TOTAL: ${data.total}
        =======================================
        `;
        
        // Convertir a buffer
        return Buffer.from(pdfContent);
    },
    
    /**
     * Guarda un PDF en el sistema de archivos
     * @param {Buffer} pdfBuffer - Buffer con el contenido del PDF
     * @param {String} fileName - Nombre del archivo
     */
    async guardarPDF(pdfBuffer, fileName) {
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
    }
};

module.exports = PDFService;
