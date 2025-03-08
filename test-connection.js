const path = require('path');
const bcrypt = require('bcrypt');

// Corregimos la ruta al archivo .env
const envPath = path.resolve('D:\\Tesis2.0\\.env');
console.log('Intentando cargar .env desde:', envPath);

// Verificamos si el archivo existe
const fs = require('fs');
if (fs.existsSync(envPath)) {
    console.log('El archivo .env existe');
    console.log('Contenido del archivo .env:');
    console.log(fs.readFileSync(envPath, 'utf8'));
} else {
    console.log('El archivo .env NO existe en la ruta especificada');
}

require('dotenv').config({ path: envPath });

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Verificando conexión a la base de datos...');
        
        // Primero verificamos que podemos consultar la tabla
        const usuarios = await prisma.usuario.findMany();
        console.log('Usuarios existentes:', usuarios.length);

        console.log('\nIntentando crear usuario administrador...');
        
        // Verificar si ya existe un admin
        const adminExists = await prisma.usuario.findFirst({
            where: { 
                email: 'admin@example.com',
                tipo: 'ADMIN'
            }
        });

        if (adminExists) {
            console.log('El administrador ya existe:', {
                id: adminExists.id,
                email: adminExists.email,
                tipo: adminExists.tipo
            });
            return;
        }

        // Crear el administrador
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.usuario.create({
            data: {
                nombre: 'Admin',
                email: 'admin@example.com',
                contrasena: hashedPassword,
                tipo: 'ADMIN'
            }
        });

        console.log('Administrador creado exitosamente:', {
            id: admin.id,
            email: admin.email,
            tipo: admin.tipo
        });
    } catch (error) {
        console.error('Error:', error);
        // Mostrar más detalles del error si están disponibles
        if (error.meta) {
            console.error('Meta:', error.meta);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testConnection(); 