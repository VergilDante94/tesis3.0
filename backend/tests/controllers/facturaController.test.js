const mockPrisma = require('../mocks/prisma');
const facturaController = require('../../controllers/facturaController');
const PDFService = require('../../services/pdfService');

jest.mock('@prisma/client');
jest.mock('../../services/pdfService');

describe('Factura Controller', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn()
        };
        // Limpiar todos los mocks
        jest.clearAllMocks();
    });

    describe('generar', () => {
        it('debería generar una factura exitosamente', async () => {
            const ordenId = '1';
            mockReq.params = { ordenId };

            const mockOrden = {
                id: 1,
                clienteId: 1,
                servicios: [
                    {
                        servicio: { precioBase: 100 },
                        cantidad: 2
                    }
                ]
            };

            mockPrisma.orden.findUnique.mockResolvedValue(mockOrden);
            mockPrisma.factura.create.mockResolvedValue({
                id: 1,
                ordenId: 1,
                subtotal: 200,
                total: 232
            });

            await facturaController.generar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    ordenId: 1
                })
            );
        });

        it('debería manejar orden no encontrada', async () => {
            mockReq.params = { ordenId: '999' };

            mockPrisma.orden.findUnique.mockResolvedValue(null);

            await facturaController.generar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Orden no encontrada'
                })
            );
        });
    });

    describe('descargarPDF', () => {
        it('debería generar y descargar un PDF exitosamente', async () => {
            const facturaId = '1';
            mockReq.params = { id: facturaId };

            const mockFactura = {
                id: 1,
                orden: {
                    id: 1,
                    cliente: {
                        usuario: { nombre: 'Test User' }
                    },
                    servicios: []
                }
            };

            mockPrisma.factura.findUnique.mockResolvedValue(mockFactura);
            PDFService.generarFacturaPDF.mockResolvedValue();

            await facturaController.descargarPDF(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/pdf'
            );
            expect(PDFService.generarFacturaPDF).toHaveBeenCalled();
        });
    });
});
