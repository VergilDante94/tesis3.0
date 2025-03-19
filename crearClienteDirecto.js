const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function crearUsuarioCliente() {
  try {
    const prisma = new PrismaClient();
    
    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash('cliente123', 10);
    
    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Cliente Prueba',
        email: 'cliente@test.com',
        contrasena: hashedPassword,
        tipo: 'CLIENTE',
        cliente: {
          create: {
            direccion: 'Calle de Prueba 123',
            telefono: '123456789'
          }
        }
      }
    });
    
    console.log('Usuario cliente creado exitosamente:', {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      tipo: usuario.tipo
    });
    
    console.log('Credenciales para iniciar sesión:');
    console.log('Email: cliente@test.com');
    console.log('Contraseña: cliente123');
    
    // Cerrar conexión
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error al crear usuario cliente:', error);
  }
}

crearUsuarioCliente(); 