const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestServices() {
    try {
        // Primero, verificar si ya existen servicios
        const existingServices = await prisma.servicio.count();
        
        if (existingServices > 0) {
            console.log('Ya existen servicios en la base de datos');
            return;
        }

        // Crear servicios de prueba
        const servicios = [
            {
                nombre: 'Mantenimiento Preventivo',
                descripcion: 'Servicio de mantenimiento preventivo para equipos industriales',
                precioBase: 150.00,
                duracionHoras: 4,
                estado: 'ACTIVO'
            },
            {
                nombre: 'Reparación de Maquinaria',
                descripcion: 'Servicio de reparación de maquinaria industrial',
                precioBase: 200.00,
                duracionHoras: 6,
                estado: 'ACTIVO'
            },
            {
                nombre: 'Calibración de Instrumentos',
                descripcion: 'Servicio de calibración de instrumentos de medición',
                precioBase: 100.00,
                duracionHoras: 2,
                estado: 'ACTIVO'
            }
        ];

        for (const servicio of servicios) {
            await prisma.servicio.create({
                data: servicio
            });
        }

        console.log('Servicios de prueba creados exitosamente');

    } catch (error) {
        console.error('Error al crear servicios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestServices();