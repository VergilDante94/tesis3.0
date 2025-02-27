const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Obtener todas las tablas
    const tables = await prisma.$queryRaw`SHOW TABLES;`;
    console.log('Tablas en la base de datos:');
    console.log(tables);

    // Describir cada tabla
    for (const table of tables) {
        const tableName = Object.values(table)[0]; // Obtener el nombre de la tabla
        console.log(`\nDescripción de la tabla: ${tableName}`);
        
        // Cambiar la forma en que se ejecuta la consulta DESCRIBE
        const description = await prisma.$queryRaw`DESCRIBE ${tableName}`;
        console.log(description);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });