require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Configuración explícita de conexión a la base de datos si no hay variable de entorno
if (!process.env.DATABASE_URL) {
    console.log('Variable DATABASE_URL no encontrada, usando configuración explícita');
    process.env.DATABASE_URL = 'mysql://root:@localhost:3306/gestion_servicios';
}

const prisma = new PrismaClient();

async function crearNotificacionPrueba() {
    try {
        console.log('Creando notificación de prueba...');
        console.log('URL de base de datos:', process.env.DATABASE_URL);
        
        // ID de usuario para enviar la notificación (puedes cambiar este valor)
        const usuarioId = 3;
        
        // Verificar si el usuario existe
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId }
        });
        
        if (!usuario) {
            console.error(`Error: Usuario con ID ${usuarioId} no encontrado`);
            return;
        }
        
        console.log(`Usuario encontrado: ${usuario.nombre} (${usuario.email})`);
        
        // Crear notificación de prueba
        const notificacion = await prisma.notificacion.create({
            data: {
                usuarioId,
                tipo: 'SISTEMA',
                mensaje: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente',
                estado: 'PENDIENTE',
                updatedAt: new Date() // Prisma requiere este campo
            }
        });
        
        console.log('Notificación creada exitosamente:', notificacion);
        console.log('ID de la notificación:', notificacion.id);
        
    } catch (error) {
        console.error('Error al crear notificación de prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

crearNotificacionPrueba(); 