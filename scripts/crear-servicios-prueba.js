const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearServiciosPrueba() {
    try {
        // Array de servicios de prueba
        const servicios = [
            // Servicios por hora
            {
                nombre: 'Limpieza General',
                descripcion: 'Servicio completo de limpieza para hogares y oficinas. Incluye limpieza de pisos, muebles, y superficies.',
                precioBase: 25.00,
                duracionHoras: 1,
                tipo: 'POR_HORA',
                estado: 'ACTIVO'
            },
            {
                nombre: 'Jardinería',
                descripcion: 'Mantenimiento de jardines, poda de plantas, y cuidado de áreas verdes.',
                precioBase: 30.00,
                duracionHoras: 1,
                tipo: 'POR_HORA',
                estado: 'ACTIVO'
            },
            {
                nombre: 'Limpieza Post-Construcción',
                descripcion: 'Limpieza profunda después de trabajos de construcción o remodelación.',
                precioBase: 35.00,
                duracionHoras: 1,
                tipo: 'POR_HORA',
                estado: 'ACTIVO'
            },
            {
                nombre: 'Cuidado de Mascotas',
                descripcion: 'Servicio de paseo y cuidado de mascotas por hora.',
                precioBase: 20.00,
                duracionHoras: 1,
                tipo: 'POR_HORA',
                estado: 'ACTIVO'
            },
            
            // Servicios por cantidad
            {
                nombre: 'Lavado de Ventanas',
                descripcion: 'Limpieza profesional por ventana, incluye marcos y vidrios.',
                precioBase: 8.00,
                duracionHoras: 1,
                tipo: 'POR_CANTIDAD',
                estado: 'ACTIVO'
            },
            {
                nombre: 'Lavado de Autos',
                descripcion: 'Servicio de lavado completo por vehículo, incluye aspirado.',
                precioBase: 45.00,
                duracionHoras: 1,
                tipo: 'POR_CANTIDAD',
                estado: 'ACTIVO'
            },
            {
                nombre: 'Planchado de Ropa',
                descripcion: 'Servicio de planchado por prenda, incluye doblado.',
                precioBase: 3.50,
                duracionHoras: 1,
                tipo: 'POR_CANTIDAD',
                estado: 'ACTIVO'
            },
            {
                nombre: 'Limpieza de Alfombras',
                descripcion: 'Limpieza profunda por alfombra, incluye desinfección.',
                precioBase: 40.00,
                duracionHoras: 1,
                tipo: 'POR_CANTIDAD',
                estado: 'ACTIVO'
            }
        ];

        // Insertar los servicios en la base de datos
        for (const servicio of servicios) {
            const creado = await prisma.servicio.create({
                data: servicio
            });
            console.log(`Servicio creado: ${servicio.nombre} (${servicio.tipo})`);
        }

        console.log('Todos los servicios han sido creados exitosamente');
    } catch (error) {
        console.error('Error al crear los servicios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la función
crearServiciosPrueba(); 