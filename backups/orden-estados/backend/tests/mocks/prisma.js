const mockPrisma = {
  usuario: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  cliente: {
    create: jest.fn(),
    findUnique: jest.fn()
  },
  trabajador: {
    create: jest.fn(),
    findUnique: jest.fn()
  },
  orden: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  factura: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  notificacion: {
    create: jest.fn()
  },
  servicio: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

module.exports = mockPrisma;
