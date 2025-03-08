const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createCliente() {
    try {
        const hashedPassword = await bcrypt.hash('cliente123', 10);
        
        const cliente = await prisma.usuario.create({
            data: {
                email: 'cliente@example.com',
                contrasena: hashedPassword,
                nombre: 'Cliente Prueba',
                tipo: 'CLIENTE',
                cliente: {
                    create: {
                        direccion: 'Somewhere',
                        telefono: '53333333'
                    }
                }
            }
        });

        console.log('Cliente creado exitosamente:', {
            id: cliente.id,
            email: cliente.email,
            nombre: cliente.nombre,
            tipo: cliente.tipo
        });

    } catch (error) {
        console.error('Error al crear el cliente:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createCliente(); 