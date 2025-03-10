const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetAdminPassword() {
    try {
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const usuario = await prisma.usuario.update({
            where: {
                email: 'admin@example.com'
            },
            data: {
                contrasena: hashedPassword
            }
        });

        console.log('Contraseña actualizada para:', usuario.email);
        console.log('Nueva contraseña:', newPassword);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword(); 