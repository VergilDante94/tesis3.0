const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('Consultando usuarios en la base de datos...');
        
        const usuarios = await prisma.usuario.findMany();
        
        console.log('Usuarios encontrados:', usuarios.length);
        
        usuarios.forEach(usuario => {
            console.log('Usuario:', {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                tipo: usuario.tipo,
                contrasena: usuario.contrasena // Mostrar la contraseña para debug
            });
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers(); 