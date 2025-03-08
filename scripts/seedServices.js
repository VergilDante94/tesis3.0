const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedServices() {
    try {
        // Primero eliminamos los servicios existentes
        await prisma.servicio.deleteMany();

        // Insertamos los nuevos servicios
        const servicios = [
            {
                nombre: 'Mantenimiento Preventivo',
                descripcion: 'Inspección y mantenimiento regular para prevenir fallos en equipos industriales',
                precioBase: 150.00,
                duracionHoras: 4,
                estado: 'ACTIVO'
            },
            {
                nombre: 'Reparación de Maquinaria',
                descripcion: 'Servicio de reparación para equipos industriales averiados',
                precioBase: 200.00,
                duracionHoras: 6,
                estado: 'ACTIVO'
            },
            {
                nombre: 'Instalación de Equipos',
                descripcion: 'Instalación profesional de nuevos equipos industriales',
                precioBase: 300.00,
                duracionHoras: 8,
                estado: 'ACTIVO'
            },
            {
                nombre: 'Calibración de Instrumentos',
                descripcion: 'Calibración precisa de instrumentos de medición industrial',
                precioBase: 120.00,
                duracionHoras: 3,
                estado: 'ACTIVO'
            },
            {
                nombre: 'Diagnóstico Técnico',
                descripcion: 'Evaluación detallada del estado de equipos y sistemas',
                precioBase: 100.00,
                duracionHoras: 2,
                estado: 'ACTIVO'
            }
        ];

        for (const servicio of servicios) {
            const created = await prisma.servicio.create({
                data: servicio
            });
            console.log(`Servicio creado: ${created.nombre}`);
        }

        console.log('Todos los servicios fueron insertados correctamente');

    } catch (error) {
        console.error('Error al insertar servicios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedServices(); 