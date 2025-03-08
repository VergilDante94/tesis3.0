const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestUsers() {
    try {
        // Crear administrador
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.usuario.create({
            data: {
                nombre: 'Admin Principal',
                email: 'admin@eicmapri.com',
                contrasena: adminPassword,
                tipoUsuario: 'ADMIN'
            }
        });
        console.log('Administrador creado:', admin);

        // Crear trabajadores
        const trabajador1Password = await bcrypt.hash('trabajador123', 10);
        const trabajador1 = await prisma.usuario.create({
            data: {
                nombre: 'Juan Pérez',
                email: 'juan@eicmapri.com',
                contrasena: trabajador1Password,
                tipoUsuario: 'TRABAJADOR',
                trabajador: {
                    create: {
                        posicion: 'Técnico',
                        departamento: 'Mantenimiento'
                    }
                }
            }
        });
        console.log('Trabajador 1 creado:', trabajador1);

        const trabajador2Password = await bcrypt.hash('trabajador123', 10);
        const trabajador2 = await prisma.usuario.create({
            data: {
                nombre: 'María García',
                email: 'maria@eicmapri.com',
                contrasena: trabajador2Password,
                tipoUsuario: 'TRABAJADOR',
                trabajador: {
                    create: {
                        posicion: 'Especialista',
                        departamento: 'Reparación'
                    }
                }
            }
        });
        console.log('Trabajador 2 creado:', trabajador2);

        // Crear clientes
        const cliente1Password = await bcrypt.hash('cliente123', 10);
        const cliente1 = await prisma.usuario.create({
            data: {
                nombre: 'Carlos Rodríguez',
                email: 'carlos@ejemplo.com',
                contrasena: cliente1Password,
                tipoUsuario: 'CLIENTE',
                cliente: {
                    create: {
                        direccion: 'Calle Principal 123',
                        telefono: '1234567890'
                    }
                }
            }
        });
        console.log('Cliente 1 creado:', cliente1);

        const cliente2Password = await bcrypt.hash('cliente123', 10);
        const cliente2 = await prisma.usuario.create({
            data: {
                nombre: 'Ana Martínez',
                email: 'ana@ejemplo.com',
                contrasena: cliente2Password,
                tipoUsuario: 'CLIENTE',
                cliente: {
                    create: {
                        direccion: 'Avenida Central 456',
                        telefono: '0987654321'
                    }
                }
            }
        });
        console.log('Cliente 2 creado:', cliente2);

        console.log('Usuarios de prueba creados exitosamente');
    } catch (error) {
        console.error('Error al crear usuarios de prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers(); 