/**
 * Servicio para generar y manejar archivos PDF de facturas
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDFService = {
    /**
     * Genera un PDF para una factura con el diseño específico de EICMAPRI
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
                    margin: 30,
                    bufferPages: true // Permite acceder a todas las páginas antes de finalizar
                });
                
                const chunks = [];
                
                // Recolectar chunks del PDF
                doc.on('data', chunk => {
                    chunks.push(chunk);
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

                // Constantes para el diseño
                const margenIzquierdo = 40;
                const margenDerecho = 40;
                const margenSuperior = 30;
                const anchoDocumento = doc.page.width - margenIzquierdo - margenDerecho;
                
                // Colores
                const colorPrimario = '#000000';
                const colorSecundario = '#666666';
                const colorDestacado = '#004b8d'; // Azul oscuro
                const colorFondo = '#f8f9fa';
                const colorEncabezado = '#e9ecef';
                
                // ENCABEZADO DE LA FACTURA
                // Rectángulo para el área del encabezado
                doc.fillColor(colorEncabezado).roundedRect(margenIzquierdo, margenSuperior, anchoDocumento, 120, 5).fill();
                
                // Logo de la empresa (esquina superior izquierda)
                let altoLogo = 0;
                try {
                    // Cargar logo (si existe)
                    const logoPath = path.join(__dirname, '../../public/img/logo.png');
                    if (fs.existsSync(logoPath)) {
                        doc.image(logoPath, margenIzquierdo + 20, margenSuperior + 20, { width: 120 });
                        altoLogo = 80; // Altura estimada del logo
                    } else {
                        // Si no hay logo, usar texto
                        doc.font('Helvetica-Bold').fontSize(24);
                        doc.fillColor(colorDestacado).text('EICMAPRI', margenIzquierdo + 20, margenSuperior + 30);
                        doc.font('Helvetica').fontSize(12);
                        doc.fillColor(colorSecundario).text('Servicios técnicos especializados', margenIzquierdo + 20, margenSuperior + 60);
                        altoLogo = 50;
                    }
                } catch (error) {
                    console.error('Error al cargar el logo:', error);
                    doc.font('Helvetica-Bold').fontSize(24);
                    doc.fillColor(colorDestacado).text('EICMAPRI', margenIzquierdo + 20, margenSuperior + 30);
                    doc.font('Helvetica').fontSize(12);
                    doc.fillColor(colorSecundario).text('Servicios técnicos especializados', margenIzquierdo + 20, margenSuperior + 60);
                    altoLogo = 50;
                }

                // Información de la empresa (lado izquierdo)
                let posYInfo = margenSuperior + 20;
                const centroX = doc.page.width / 2;
                
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colorPrimario);
                doc.text('EMPRESA DE INGENIERÍA Y CONTROL DE LA MAPRI', centroX - 100, posYInfo, { align: 'center', width: 200 });
                
                posYInfo += 15;
                doc.font('Helvetica').fontSize(8).fillColor(colorSecundario);
                doc.text('NIT: 50004392550', centroX - 100, posYInfo, { align: 'center', width: 200 });
                
                posYInfo += 12;
                doc.text('CALLE 2da. #1 / A y Pasaje 39', centroX - 100, posYInfo, { align: 'center', width: 200 });
                
                posYInfo += 12;
                doc.text('RPTO. 26 DE JULIO DEL RIO, Manzanillo', centroX - 100, posYInfo, { align: 'center', width: 200 });
                
                posYInfo += 12;
                doc.text('Teléfono: (+53) 23-573497', centroX - 100, posYInfo, { align: 'center', width: 200 });
                
                posYInfo += 12;
                doc.text('Email: direccion@eicmapri.co.cu', centroX - 100, posYInfo, { align: 'center', width: 200 });

                // Información de factura (lado derecho)
                const posXInvoiceInfo = centroX + 50;
                let posYInvoiceInfo = margenSuperior + 20;
                
                // Título FACTURA con fondo resaltado
                doc.fillColor(colorDestacado).roundedRect(posXInvoiceInfo, posYInvoiceInfo, 170, 30, 3).fill();
                
                doc.font('Helvetica-Bold').fontSize(16).fillColor('white');
                doc.text('FACTURA', posXInvoiceInfo, posYInvoiceInfo + 8, { align: 'center', width: 170 });
                
                posYInvoiceInfo += 40;
                
                // Detalles de la factura
                doc.font('Helvetica-Bold').fontSize(9).fillColor(colorPrimario);
                doc.text('FECHA:', posXInvoiceInfo, posYInvoiceInfo);
                doc.font('Helvetica').fontSize(9);
                doc.text(data.fecha || new Date().toLocaleDateString(), posXInvoiceInfo + 100, posYInvoiceInfo, { align: 'right', width: 70 });
                
                posYInvoiceInfo += 15;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(colorPrimario);
                doc.text('Nº FACTURA:', posXInvoiceInfo, posYInvoiceInfo);
                doc.font('Helvetica').fontSize(9);
                doc.text(data.numeroFactura || 'FC-000', posXInvoiceInfo + 100, posYInvoiceInfo, { align: 'right', width: 70 });
                
                posYInvoiceInfo += 15;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(colorPrimario);
                doc.text('Nº ORDEN:', posXInvoiceInfo, posYInvoiceInfo);
                doc.font('Helvetica').fontSize(9);
                doc.text(data.numeroOrden || '000', posXInvoiceInfo + 100, posYInvoiceInfo, { align: 'right', width: 70 });
                
                // Estado de pago (Opcional)
                if (data.estadoPago) {
                    posYInvoiceInfo += 20;
                    doc.fillColor(data.estadoPago === 'PAGADO' ? '#4caf50' : '#ff9800')
                        .roundedRect(posXInvoiceInfo, posYInvoiceInfo, 170, 20, 3)
                        .fill();
                    
                    doc.font('Helvetica-Bold').fontSize(10).fillColor('white');
                    doc.text(data.estadoPago, posXInvoiceInfo, posYInvoiceInfo + 5, { align: 'center', width: 170 });
                }

                // INFORMACIÓN DEL CLIENTE
                const posYCliente = margenSuperior + 160;
                
                // Título del bloque cliente
                doc.fillColor(colorDestacado).roundedRect(margenIzquierdo, posYCliente, anchoDocumento, 25, 3).fill();
                doc.font('Helvetica-Bold').fontSize(12).fillColor('white');
                doc.text('DATOS DEL CLIENTE', margenIzquierdo + 10, posYCliente + 7);
                
                // Tabla de información del cliente
                const tablaClienteY = posYCliente + 35;
                
                // Marco de la tabla cliente
                doc.strokeColor(colorSecundario).lineWidth(0.5)
                    .roundedRect(margenIzquierdo, tablaClienteY, anchoDocumento, 80, 3)
                    .stroke();
                
                // Línea divisoria vertical en la tabla cliente
                doc.moveTo(centroX, tablaClienteY).lineTo(centroX, tablaClienteY + 80).stroke();
                
                // Línea divisoria horizontal en la tabla cliente
                doc.moveTo(margenIzquierdo, tablaClienteY + 40).lineTo(doc.page.width - margenDerecho, tablaClienteY + 40).stroke();

                // Datos del cliente
                doc.font('Helvetica-Bold').fontSize(9).fillColor(colorPrimario);
                
                // Primera fila
                doc.text('Cliente:', margenIzquierdo + 10, tablaClienteY + 10);
                doc.font('Helvetica').fontSize(9);
                doc.text(data.cliente?.nombre || 'Cliente no especificado', margenIzquierdo + 70, tablaClienteY + 10, 
                         { width: centroX - margenIzquierdo - 80 });
                
                doc.font('Helvetica-Bold');
                doc.text('NIT/ID:', centroX + 10, tablaClienteY + 10);
                doc.font('Helvetica');
                doc.text(data.cliente?.id || 'ID no disponible', centroX + 70, tablaClienteY + 10);
                
                // Segunda fila
                doc.font('Helvetica-Bold');
                doc.text('Email:', margenIzquierdo + 10, tablaClienteY + 50);
                doc.font('Helvetica');
                doc.text(data.cliente?.email || 'Email no disponible', margenIzquierdo + 70, tablaClienteY + 50);
                
                doc.font('Helvetica-Bold');
                doc.text('Teléfono:', centroX + 10, tablaClienteY + 50);
                doc.font('Helvetica');
                doc.text(data.cliente?.telefono || 'Teléfono no disponible', centroX + 70, tablaClienteY + 50);

                // TABLA DE SERVICIOS/PRODUCTOS
                const posYServicios = tablaClienteY + 110;
                
                // Título del bloque servicios
                doc.fillColor(colorDestacado).roundedRect(margenIzquierdo, posYServicios, anchoDocumento, 25, 3).fill();
                doc.font('Helvetica-Bold').fontSize(12).fillColor('white');
                doc.text('DETALLE DE SERVICIOS', margenIzquierdo + 10, posYServicios + 7);
                
                // Encabezados de tabla
                const tablaServiciosY = posYServicios + 35;
                const altoFilaEncabezado = 25;
                const altoFilaDetalle = 25;
                
                // Marco de la tabla servicios
                doc.strokeColor(colorSecundario).lineWidth(0.5)
                    .roundedRect(margenIzquierdo, tablaServiciosY, anchoDocumento, 
                                data.detalles && data.detalles.length > 0 ? 
                                altoFilaEncabezado + (data.detalles.length * altoFilaDetalle) : 
                                altoFilaEncabezado + altoFilaDetalle, 3)
                    .stroke();
                
                // Fondo del encabezado
                doc.fillColor(colorEncabezado)
                    .rect(margenIzquierdo + 0.5, tablaServiciosY + 0.5, anchoDocumento - 1, altoFilaEncabezado - 1)
                    .fill();
                
                // Líneas divisorias en encabezados
                const colDescripcion = margenIzquierdo;
                const colCantidad = doc.page.width - margenDerecho - 240;
                const colPrecio = doc.page.width - margenDerecho - 160;
                const colImporte = doc.page.width - margenDerecho - 80;
                
                doc.strokeColor(colorSecundario).lineWidth(0.5);
                doc.moveTo(colCantidad, tablaServiciosY).lineTo(colCantidad, tablaServiciosY + altoFilaEncabezado).stroke();
                doc.moveTo(colPrecio, tablaServiciosY).lineTo(colPrecio, tablaServiciosY + altoFilaEncabezado).stroke();
                doc.moveTo(colImporte, tablaServiciosY).lineTo(colImporte, tablaServiciosY + altoFilaEncabezado).stroke();
                
                // Textos de encabezados
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colorPrimario);
                doc.text('DESCRIPCIÓN', colDescripcion + 10, tablaServiciosY + 8);
                doc.text('CANTIDAD', colCantidad + 10, tablaServiciosY + 8);
                doc.text('PRECIO UNIT.', colPrecio + 10, tablaServiciosY + 8);
                doc.text('IMPORTE', colImporte + 10, tablaServiciosY + 8);

                // Detalles de los servicios o productos
                let y = tablaServiciosY + altoFilaEncabezado;
                doc.font('Helvetica').fontSize(9).fillColor(colorPrimario);
                
                if (data.detalles && data.detalles.length > 0) {
                    // Dibujar líneas divisorias para cada fila
                    data.detalles.forEach((_, index) => {
                        const yLine = y + (index * altoFilaDetalle);
                        if (index < data.detalles.length - 1) {
                            doc.moveTo(margenIzquierdo, yLine).lineTo(doc.page.width - margenDerecho, yLine).stroke();
                        }
                        
                        // Líneas verticales
                        doc.moveTo(colCantidad, yLine).lineTo(colCantidad, yLine + altoFilaDetalle).stroke();
                        doc.moveTo(colPrecio, yLine).lineTo(colPrecio, yLine + altoFilaDetalle).stroke();
                        doc.moveTo(colImporte, yLine).lineTo(colImporte, yLine + altoFilaDetalle).stroke();
                    });
                    
                    // Añadir datos de cada servicio
                    data.detalles.forEach((detalle, index) => {
                        const yPos = y + (index * altoFilaDetalle) + 8;
                        
                        // Obtener el nombre del producto/servicio
                        const nombreProducto = detalle.nombre || detalle.servicio || detalle.descripcion || 'Servicio no especificado';
                        
                        // Datos
                        doc.text(nombreProducto, colDescripcion + 10, yPos, 
                                { width: colCantidad - colDescripcion - 20, ellipsis: true });
                        doc.text(detalle.cantidad.toString(), colCantidad + 10, yPos);
                        doc.text(detalle.precioUnitario.toFixed(2), colPrecio + 10, yPos);
                        doc.text(detalle.importe.toFixed(2), colImporte + 10, yPos);
                    });
                    
                    y += data.detalles.length * altoFilaDetalle;
                } else {
                    // Si no hay detalles, mostrar fila vacía
                    doc.moveTo(colCantidad, y).lineTo(colCantidad, y + altoFilaDetalle).stroke();
                    doc.moveTo(colPrecio, y).lineTo(colPrecio, y + altoFilaDetalle).stroke();
                    doc.moveTo(colImporte, y).lineTo(colImporte, y + altoFilaDetalle).stroke();
                    
                    doc.text('No hay servicios detallados', colDescripcion + 10, y + 8);
                    doc.text('0', colCantidad + 10, y + 8);
                    doc.text('0.00', colPrecio + 10, y + 8);
                    doc.text('0.00', colImporte + 10, y + 8);
                    
                    y += altoFilaDetalle;
                }

                // SECCIÓN DE TOTALES
                const posYTotales = y + 20;
                const anchoTotales = 200;
                const altoTotales = 90;
                const inicioTotalesX = doc.page.width - margenDerecho - anchoTotales;
                
                // Marco de la tabla de totales
                doc.strokeColor(colorSecundario).lineWidth(0.5)
                    .roundedRect(inicioTotalesX, posYTotales, anchoTotales, altoTotales, 3)
                    .stroke();
                
                // Líneas divisorias para totales
                let lineaY = posYTotales + 30;
                doc.moveTo(inicioTotalesX, lineaY).lineTo(inicioTotalesX + anchoTotales, lineaY).stroke();
                
                lineaY = posYTotales + 60;
                doc.moveTo(inicioTotalesX, lineaY).lineTo(inicioTotalesX + anchoTotales, lineaY).stroke();
                
                // Subtotal
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colorPrimario);
                doc.text('SUBTOTAL:', inicioTotalesX + 15, posYTotales + 10);
                doc.font('Helvetica').fontSize(10);
                doc.text(`${data.subtotal ? data.subtotal.toFixed(2) : '0.00'} CUP`, inicioTotalesX + anchoTotales - 15, posYTotales + 10, { align: 'right' });
                
                // Impuestos
                doc.font('Helvetica-Bold');
                doc.text('IMPUESTOS:', inicioTotalesX + 15, posYTotales + 40);
                doc.font('Helvetica');
                doc.text('0.00 CUP', inicioTotalesX + anchoTotales - 15, posYTotales + 40, { align: 'right' });
                
                // Total
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('TOTAL:', inicioTotalesX + 15, posYTotales + 70);
                doc.text(`${data.total ? data.total.toFixed(2) : '0.00'} CUP`, inicioTotalesX + anchoTotales - 15, posYTotales + 70, { align: 'right' });
                
                // Texto del total en palabras
                const totalEnPalabras = numeroALetras(data.total || 0);
                
                const posYPalabras = posYTotales + altoTotales + 20;
                doc.strokeColor(colorDestacado).lineWidth(0.5)
                    .roundedRect(margenIzquierdo, posYPalabras, anchoDocumento, 30, 3)
                    .stroke();
                
                doc.font('Helvetica-Bold').fontSize(9).fillColor(colorPrimario);
                doc.text('TOTAL EN LETRAS:', margenIzquierdo + 10, posYPalabras + 10);
                doc.font('Helvetica').fontSize(9);
                doc.text(`${totalEnPalabras} PESOS CUBANOS`, margenIzquierdo + 120, posYPalabras + 10);

                // SECCIÓN FINAL - Notas y términos
                const posYNotas = posYPalabras + 50;
                
                // Marco para notas y términos
                doc.strokeColor(colorSecundario).lineWidth(0.5)
                    .roundedRect(margenIzquierdo, posYNotas, anchoDocumento, 90, 3)
                    .stroke();
                
                // Título de notas
                doc.fillColor(colorDestacado).roundedRect(margenIzquierdo, posYNotas, anchoDocumento, 25, 3).fill();
                doc.font('Helvetica-Bold').fontSize(11).fillColor('white');
                doc.text('NOTAS Y TÉRMINOS', margenIzquierdo + 10, posYNotas + 7);
                
                // Contenido de notas
                let posYNotasContent = posYNotas + 35;
                doc.font('Helvetica').fontSize(8).fillColor(colorPrimario);
                doc.text('• Esta factura es un documento legal y sirve como comprobante de la transacción.', margenIzquierdo + 10, posYNotasContent);
                
                posYNotasContent += 12;
                doc.text('• El plazo para el pago es de 30 días a partir de la fecha de emisión.', margenIzquierdo + 10, posYNotasContent);
                
                posYNotasContent += 12;
                doc.text('• Para cualquier consulta sobre esta factura, por favor contacte a nuestro departamento de facturación.', margenIzquierdo + 10, posYNotasContent);
                
                posYNotasContent += 12;
                doc.text('• Cuenta Bancaria: 1215354001169210 (BPA Sucursal 153)', margenIzquierdo + 10, posYNotasContent);

                // Pie de página
                doc.font('Helvetica').fontSize(8).fillColor(colorSecundario);
                doc.text('EICMAPRI - Empresa de Ingeniería y Control de la Mapri', margenIzquierdo, doc.page.height - 50, {
                    width: anchoDocumento,
                    align: 'center'
                });
                
                doc.text('Email: direccion@eicmapri.co.cu | Teléfono: (+53) 23-573497', margenIzquierdo, doc.page.height - 35, {
                    width: anchoDocumento,
                    align: 'center'
                });
                
                // Agregar numeración de página en todas las páginas
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);
                    doc.font('Helvetica').fontSize(8).fillColor(colorSecundario);
                    doc.text(
                        `Página ${i + 1} de ${range.count}`,
                        margenIzquierdo,
                        doc.page.height - 20,
                        { align: 'center', width: anchoDocumento }
                    );
                }
                
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

/**
 * Convierte un número a su representación textual
 * @param {Number} numero - El número a convertir
 * @returns {String} - Representación textual del número
 */
function numeroALetras(numero) {
    // Función simplificada para convertir números a palabras en español
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    let parteEntera = Math.floor(numero);
    let parteDecimal = Math.round((numero - parteEntera) * 100);
    
    let resultado = '';
    
    if (parteEntera === 0) {
        resultado = 'CERO';
    } else if (parteEntera === 1) {
        resultado = 'UN';
    } else if (parteEntera < 10) {
        resultado = unidades[parteEntera];
    } else if (parteEntera < 100) {
        const unidad = parteEntera % 10;
        const decena = Math.floor(parteEntera / 10);
        
        if (unidad === 0) {
            resultado = decenas[decena];
        } else {
            resultado = `${decenas[decena]} Y ${unidades[unidad]}`;
        }
    } else if (parteEntera < 1000) {
        const centena = Math.floor(parteEntera / 100);
        const resto = parteEntera % 100;
        
        if (resto === 0) {
            resultado = centenas[centena];
        } else {
            if (centena === 1 && resto === 0) {
                resultado = 'CIEN';
            } else {
                const restoEnLetras = numeroALetras(resto);
                resultado = `${centenas[centena]} ${restoEnLetras}`;
            }
        }
    } else if (parteEntera < 2000) {
        const resto = parteEntera % 1000;
        if (resto === 0) {
            resultado = 'MIL';
        } else {
            resultado = `MIL ${numeroALetras(resto)}`;
        }
    } else {
        resultado = 'CANTIDAD FUERA DE RANGO';
    }
    
    // Agregar parte decimal
    if (parteDecimal > 0) {
        return `${resultado} CON ${parteDecimal.toString().padStart(2, '0')}/100`;
    }
    
    return resultado;
}

module.exports = PDFService;
