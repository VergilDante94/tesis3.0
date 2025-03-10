const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('Intentando conectar a la base de datos...');
        
        // Verificar la conexión
        await prisma.$connect();
        console.log('Conexión a la base de datos establecida');

        // Intentar obtener un usuario
        const usuario = await prisma.usuario.findFirst();
        console.log('Búsqueda de usuario completada');
        console.log('Usuario de prueba encontrado:', usuario ? 'Sí' : 'No');
        
        if (!usuario) {
            console.log('Creando usuario de prueba...');
            // Crear un usuario de prueba si no existe ninguno
            const nuevoUsuario = await prisma.usuario.create({
                data: {
                    email: 'admin@test.com',
                    contrasena: 'admin123',
                    nombre: 'Administrador',
                    tipo: 'ADMIN'
                }
            });
            console.log('Usuario de prueba creado exitosamente:', nuevoUsuario);
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        console.error('Detalles del error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    } finally {
        await prisma.$disconnect();
        console.log('Conexión a la base de datos cerrada');
    }
}

// Ejecutar la prueba
console.log('Iniciando prueba de conexión...');
testConnection()
    .then(() => console.log('Prueba completada'))
    .catch(error => console.error('Error en la prueba:', error)); 