const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const envPath = path.resolve('D:\\Tesis2.0\\.env');
require('dotenv').config({ path: envPath });

const { PrismaClient } = require('@prisma/client');

async function testLogin() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Intentando iniciar sesión como administrador...');
        
        // Buscar el usuario
        const usuario = await prisma.usuario.findUnique({
            where: { 
                email: 'admin@example.com'
            }
        });

        if (!usuario) {
            console.log('Usuario no encontrado');
            return;
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare('admin123', usuario.contrasena);
        
        if (!validPassword) {
            console.log('Contraseña incorrecta');
            return;
        }

        // Generar token
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email, 
                tipo: usuario.tipo 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login exitoso!');
        console.log('Usuario:', {
            id: usuario.id,
            email: usuario.email,
            tipo: usuario.tipo
        });
        console.log('\nToken JWT generado:', token);
        
        // Verificar que el token sea válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('\nToken decodificado:', decoded);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin(); 