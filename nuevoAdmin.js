const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Crear una instancia de PrismaClient con la URL de la base de datos
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://root:Bryan940730*@localhost:3306/gestion_servicios"
    }
  }
});

async function crearAdmin() {
  try {
    // Verificar si ya existe un administrador con el mismo email
    const existente = await prisma.usuario.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existente) {
      console.log('❌ Ya existe un usuario con el email: nuevoadmin@sistema.com');
      return;
    }

    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    
    // Crear el usuario administrador
    const admin = await prisma.usuario.create({
      data: {
        nombre: 'Nuevo Administrador',
        email: 'admin@example.com',
        contrasena: hashedPassword,
        tipo: 'ADMIN'
      }
    });
    
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`ID: ${admin.id}`);
    console.log(`Nombre: ${admin.nombre}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Tipo: ${admin.tipo}`);
    console.log('\nCredenciales de acceso:');
    console.log('Email: admin@example.com');
    console.log('Contraseña: Admin123');
    
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