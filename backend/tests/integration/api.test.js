const request = require('supertest');
const mockPrisma = require('../mocks/prisma');

// Mock de PrismaClient antes de importar los controladores
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../../server');
const jwt = require('jsonwebtoken');

describe('API Integration Tests', () => {
    let token;

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = 'test-secret-key';

        // Crear un token de prueba
        token = jwt.sign(
            { id: 1, email: 'test@test.com', tipoUsuario: 'CLIENTE' },
            process.env.JWT_SECRET
        );

        // Mock de usuario para login
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: 1,
            email: 'test@test.com',
            contrasena: '$2b$10$testhashedpassword',
            nombre: 'Test User',
            tipoUsuario: 'CLIENTE'
        });
    });

    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('Endpoints de Usuario', () => {
        it('debería registrar un nuevo usuario', async () => {
            mockPrisma.usuario.create.mockResolvedValue({
                id: 2,
                nombre: 'New User',
                email: 'new@test.com'
            });

            mockPrisma.cliente.create.mockResolvedValue({
                id: 1,
                usuarioId: 2,
                direccion: 'Test Address',
                telefono: '1234567890'
            });

            const response = await request(app)
                .post('/api/usuarios/registro')
                .send({
                    nombre: 'New User',
                    email: 'new@test.com',
                    contrasena: 'password123',
                    tipoUsuario: 'CLIENTE',
                    direccion: 'Test Address',
                    telefono: '1234567890'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('userId');
        });

        it('debería fallar al registrar un usuario con email duplicado', async () => {
            mockPrisma.usuario.create.mockRejectedValue(
                new Error('Unique constraint failed on the fields: (`email`)')
            );

            const response = await request(app)
                .post('/api/usuarios/registro')
                .send({
                    nombre: 'New User',
                    email: 'test@test.com',
                    contrasena: 'password123',
                    tipoUsuario: 'CLIENTE',
                    direccion: 'Test Address',
                    telefono: '1234567890'
                });

            expect(response.status).toBe(500);
        });
    });

    describe('Endpoints de Factura', () => {
        it('debería listar facturas del cliente', async () => {
            mockPrisma.factura.findMany.mockResolvedValue([
                {
                    id: 1,
                    ordenId: 1,
                    subtotal: 100,
                    total: 116,
                    fecha: new Date(),
                    orden: {
                        servicios: []
                    }
                }
            ]);

            const response = await request(app)
                .get('/api/facturas/cliente/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('debería fallar al acceder sin token', async () => {
            const response = await request(app)
                .get('/api/facturas/cliente/1');

            expect(response.status).toBe(401);
        });
    });
});
