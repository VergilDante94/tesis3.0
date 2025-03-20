const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminFields() {
  try {
    // Buscar el usuario administrador
    const admin = await prisma.usuario.findFirst({
      where: { tipo: 'ADMIN' }
    });
    
    if (!admin) {
      console.log('No se encontró un usuario administrador');
      return;
    }
    
    console.log('Administrador encontrado:', admin);
    
    // Actualizar los campos de dirección y teléfono
    const updated = await prisma.usuario.update({
      where: { id: admin.id },
      data: {
        direccion: 'Calle Principal 123',
        telefono: '555-123456'
      }
    });
    
    console.log('Usuario actualizado:', updated);
    
  } catch (error) {
    console.error('Error al actualizar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminFields(); 