const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function eliminarServicios() {
    try {
        await prisma.servicio.deleteMany({});
        console.log('Todos los servicios han sido eliminados');
    } catch (error) {
        console.error('Error al eliminar servicios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

eliminarServicios(); 