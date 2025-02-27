require('dotenv').config(); // Asegúrate de que esto esté al principio del archivo
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Intenta hacer una consulta simple para verificar la conexión
    const servicios = await prisma.servicios.findMany(); // Asegúrate de que el modelo 'servicios' esté definido en schema.prisma
    console.log('Conexión exitosa a la base de datos. Servicios:', servicios);
}

main()
    .catch(e => {
        console.error('Error al conectar a la base de datos:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 