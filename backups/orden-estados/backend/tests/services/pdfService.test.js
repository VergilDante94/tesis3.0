const PDFService = require('../../services/pdfService');
const { Writable } = require('stream');

describe('PDF Service', () => {
    it('debería generar un PDF sin errores', (done) => {
        const mockFactura = {
            id: 1,
            fecha: new Date(),
            subtotal: 100,
            total: 116,
            orden: {
                id: 1,
                cliente: {
                    usuario: {
                        nombre: 'Test User'
                    },
                    direccion: 'Test Address',
                    telefono: '1234567890'
                },
                servicios: [
                    {
                        servicio: {
                            nombre: 'Test Service',
                            precioBase: 100
                        },
                        cantidad: 1
                    }
                ]
            }
        };

        const chunks = [];
        const mockStream = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            }
        });

        mockStream.on('finish', () => {
            try {
                const pdfBuffer = Buffer.concat(chunks);
                expect(pdfBuffer.length).toBeGreaterThan(0);
                expect(pdfBuffer.toString()).toContain('PDF');
                done();
            } catch (error) {
                done(error);
            }
        });

        PDFService.generarFacturaPDF(mockFactura, mockStream);
    });
});
