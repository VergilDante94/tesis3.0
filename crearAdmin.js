const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function crearAdmin() {
  try {
    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    // Crear el usuario administrador
    const admin = await prisma.usuario.create({
      data: {
        nombre: 'Nuevo Administrador',
        email: 'nuevoadmin@sistema.com',
        contrasena: hashedPassword,
        tipoUsuario: 'ADMIN'
      }
    });
    
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`ID: ${admin.id}`);
    console.log(`Nombre: ${admin.nombre}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Tipo: ${admin.tipoUsuario}`);
    console.log('\nCredenciales de acceso:');
    console.log('Email: nuevoadmin@sistema.com');
    console.log('Contraseña: Admin123!');
    
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
    
    // Verificar si el error es por duplicación de email
    if (error.code === 'P2002') {
      console.log('El email ya está en uso. Intente con otro email.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

crearAdmin(); 