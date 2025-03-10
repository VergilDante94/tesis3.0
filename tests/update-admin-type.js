const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminType() {
    try {
        const usuario = await prisma.usuario.update({
            where: {
                email: 'admin@example.com'
            },
            data: {
                tipo: 'ADMIN'
            }
        });
        
        console.log('Usuario actualizado:', usuario);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminType();