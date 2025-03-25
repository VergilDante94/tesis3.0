const mockPrisma = require('../mocks/prisma');
const servicioController = require('../../controllers/servicioController');

jest.mock('@prisma/client');

describe('Servicio Controller', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('debería crear un servicio exitosamente', async () => {
            const servicioData = {
                nombre: 'Servicio Test',
                descripcion: 'Descripción del servicio test',
                precioBase: 100.00
            };

            mockReq.body = servicioData;

            mockPrisma.servicio.create.mockResolvedValue({
                id: 1,
                ...servicioData
            });

            await servicioController.crear(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    ...servicioData
                })
            );
        });

        it('debería manejar errores al crear servicio', async () => {
            mockReq.body = {
                nombre: 'Servicio Test'
            };

            mockPrisma.servicio.create.mockRejectedValue(new Error('Error de BD'));

            await servicioController.crear(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Error al crear servicio'
                })
            );
        });
    });

    describe('listar', () => {
        it('debería listar todos los servicios', async () => {
            const mockServicios = [
                {
                    id: 1,
                    nombre: 'Servicio 1',
                    descripcion: 'Descripción 1',
                    precioBase: 100.00
                },
                {
                    id: 2,
                    nombre: 'Servicio 2',
                    descripcion: 'Descripción 2',
                    precioBase: 200.00
                }
            ];

            mockPrisma.servicio.findMany.mockResolvedValue(mockServicios);

            await servicioController.listar(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockServicios);
        });

        it('debería manejar errores al listar servicios', async () => {
            mockPrisma.servicio.findMany.mockRejectedValue(new Error('Error de BD'));

            await servicioController.listar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Error al listar servicios'
                })
            );
        });
    });

    describe('obtener', () => {
        it('debería obtener un servicio por ID', async () => {
            const mockServicio = {
                id: 1,
                nombre: 'Servicio Test',
                descripcion: 'Descripción test',
                precioBase: 100.00
            };

            mockReq.params = { id: '1' };

            mockPrisma.servicio.findUnique.mockResolvedValue(mockServicio);

            await servicioController.obtener(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockServicio);
        });

        it('debería manejar servicio no encontrado', async () => {
            mockReq.params = { id: '999' };

            mockPrisma.servicio.findUnique.mockResolvedValue(null);

            await servicioController.obtener(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Servicio no encontrado'
                })
            );
        });
    });

    describe('actualizar', () => {
        it('debería actualizar un servicio exitosamente', async () => {
            const servicioData = {
                nombre: 'Servicio Actualizado',
                descripcion: 'Descripción actualizada',
                precioBase: 150.00
            };

            mockReq.params = { id: '1' };
            mockReq.body = servicioData;

            mockPrisma.servicio.update.mockResolvedValue({
                id: 1,
                ...servicioData
            });

            await servicioController.actualizar(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    ...servicioData
                })
            );
        });

        it('debería manejar errores al actualizar servicio', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = {
                nombre: 'Servicio Actualizado'
            };

            mockPrisma.servicio.update.mockRejectedValue(new Error('Error de BD'));

            await servicioController.actualizar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Error al actualizar servicio'
                })
            );
        });
    });

    describe('eliminar', () => {
        it('debería eliminar un servicio exitosamente', async () => {
            mockReq.params = { id: '1' };

            mockPrisma.servicio.delete.mockResolvedValue({
                id: 1,
                nombre: 'Servicio Eliminado'
            });

            await servicioController.eliminar(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Servicio eliminado exitosamente'
                })
            );
        });

        it('debería manejar errores al eliminar servicio', async () => {
            mockReq.params = { id: '1' };

            mockPrisma.servicio.delete.mockRejectedValue(new Error('Error de BD'));

            await servicioController.eliminar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Error al eliminar servicio'
                })
            );
        });
    });
}); 