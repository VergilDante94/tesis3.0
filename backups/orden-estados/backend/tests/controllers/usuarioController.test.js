const mockPrisma = require('../mocks/prisma');
const usuarioController = require('../../controllers/usuarioController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client');

describe('Usuario Controller', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset mocks
        mockReq = {
            body: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        // Limpiar todos los mocks
        jest.clearAllMocks();
    });

    describe('registrar', () => {
        it('debería registrar un nuevo cliente exitosamente', async () => {
            const userData = {
                nombre: 'Test User',
                email: 'test@test.com',
                contrasena: 'password123',
                tipoUsuario: 'CLIENTE',
                direccion: 'Test Address',
                telefono: '1234567890'
            };

            mockReq.body = userData;

            mockPrisma.usuario.create.mockResolvedValue({
                id: 1,
                ...userData
            });

            mockPrisma.cliente.create.mockResolvedValue({
                id: 1,
                usuarioId: 1,
                direccion: userData.direccion,
                telefono: userData.telefono
            });

            await usuarioController.registrar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Usuario creado exitosamente',
                    userId: 1
                })
            );
        });

        it('debería manejar errores durante el registro', async () => {
            mockReq.body = {
                email: 'test@test.com',
                contrasena: 'password123'
            };

            mockPrisma.usuario.create.mockRejectedValue(new Error('Error de BD'));

            await usuarioController.registrar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Error al crear usuario'
                })
            );
        });
    });

    describe('login', () => {
        it('debería autenticar un usuario exitosamente', async () => {
            const userData = {
                email: 'test@test.com',
                contrasena: 'password123'
            };

            mockReq.body = userData;

            const hashedPassword = await bcrypt.hash(userData.contrasena, 10);
            
            mockPrisma.usuario.findUnique.mockResolvedValue({
                id: 1,
                email: userData.email,
                contrasena: hashedPassword,
                nombre: 'Test User',
                tipoUsuario: 'CLIENTE'
            });

            await usuarioController.login(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: expect.any(String),
                    usuario: expect.objectContaining({
                        id: 1,
                        email: userData.email
                    })
                })
            );
        });

        it('debería rechazar credenciales inválidas', async () => {
            mockReq.body = {
                email: 'test@test.com',
                contrasena: 'wrongpassword'
            };

            mockPrisma.usuario.findUnique.mockResolvedValue(null);

            await usuarioController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Credenciales inválidas'
                })
            );
        });
    });
});
