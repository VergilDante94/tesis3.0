// Script para eliminar servicios de forma segura
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

// Crear interfaz para leer la entrada del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para preguntar por el ID del servicio
function preguntarPorServicio() {
  return new Promise((resolve) => {
    rl.question('Ingrese el ID del servicio a eliminar (o "listar" para ver todos los servicios, "salir" para terminar): ', (respuesta) => {
      resolve(respuesta.trim());
    });
  });
}

// Función para confirmar la acción
function confirmarAccion(mensaje) {
  return new Promise((resolve) => {
    rl.question(`${mensaje} (s/n): `, (respuesta) => {
      resolve(respuesta.trim().toLowerCase() === 's');
    });
  });
}

// Función para listar todos los servicios
async function listarServicios() {
  try {
    const servicios = await prisma.servicio.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('\n=== SERVICIOS DISPONIBLES ===');
    if (servicios.length === 0) {
      console.log('No hay servicios disponibles.');
      return;
    }
    
    servicios.forEach(servicio => {
      console.log(`ID: ${servicio.id} | Nombre: ${servicio.nombre} | Estado: ${servicio.estado} | Tipo: ${servicio.tipo} | Precio: $${servicio.precioBase}`);
    });
    console.log('');
  } catch (error) {
    console.error('Error al listar servicios:', error);
  }
}

// Función para verificar si un servicio está en uso
async function verificarServicioEnUso(servicioId) {
  try {
    const ordenesConServicio = await prisma.ordenServicio.findMany({
      where: {
        servicioId: parseInt(servicioId)
      },
      include: {
        orden: true
      }
    });
    
    return ordenesConServicio.length > 0 ? ordenesConServicio : false;
  } catch (error) {
    console.error('Error al verificar si el servicio está en uso:', error);
    return false;
  }
}

// Función para eliminar un servicio
async function eliminarServicio(servicioId) {
  try {
    // Verificar si el servicio existe
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(servicioId) }
    });
    
    if (!servicio) {
      console.log(`\nError: El servicio con ID ${servicioId} no existe.`);
      return;
    }
    
    console.log(`\nServicio encontrado: ${servicio.nombre}`);
    
    // Verificar si el servicio está siendo utilizado en alguna orden
    const servicioEnUso = await verificarServicioEnUso(servicioId);
    
    if (servicioEnUso) {
      console.log(`\nATENCIÓN: El servicio está siendo utilizado en ${servicioEnUso.length} orden(es):`);
      servicioEnUso.forEach(item => {
        console.log(`- Orden #${item.orden.id} (Estado: ${item.orden.estado})`);
      });
      
      const marcarInactivo = await confirmarAccion(
        '¿Desea marcar el servicio como INACTIVO en lugar de eliminarlo?'
      );
      
      if (marcarInactivo) {
        // Marcar como inactivo
        const servicioActualizado = await prisma.servicio.update({
          where: { id: parseInt(servicioId) },
          data: { estado: 'INACTIVO' }
        });
        
        console.log(`\nServicio "${servicioActualizado.nombre}" marcado como INACTIVO exitosamente.`);
      } else {
        console.log('\nOperación cancelada. El servicio no ha sido modificado.');
      }
    } else {
      // Si no está en uso, preguntar si desea eliminarlo completamente
      const confirmacion = await confirmarAccion(
        '¿Está seguro que desea ELIMINAR PERMANENTEMENTE este servicio?'
      );
      
      if (confirmacion) {
        await prisma.servicio.delete({
          where: { id: parseInt(servicioId) }
        });
        
        console.log(`\nServicio "${servicio.nombre}" eliminado exitosamente.`);
      } else {
        console.log('\nOperación cancelada. El servicio no ha sido eliminado.');
      }
    }
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
  }
}

// Función principal
async function main() {
  console.log('=== HERRAMIENTA DE ELIMINACIÓN DE SERVICIOS ===');
  console.log('Esta herramienta permite eliminar servicios de forma segura.\n');
  
  try {
    while (true) {
      const respuesta = await preguntarPorServicio();
      
      if (respuesta.toLowerCase() === 'salir') {
        break;
      }
      
      if (respuesta.toLowerCase() === 'listar') {
        await listarServicios();
        continue;
      }
      
      if (!respuesta || isNaN(respuesta)) {
        console.log('Por favor, ingrese un número de ID válido.\n');
        continue;
      }
      
      await eliminarServicio(respuesta);
    }
  } catch (error) {
    console.error('Error en el programa:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Ejecutar el programa
main(); 