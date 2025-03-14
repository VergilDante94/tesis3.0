// Script para analizar detalladamente los servicios
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarServicios() {
  try {
    // Recuperar todos los servicios
    const servicios = await prisma.servicio.findMany({
      include: {
        ordenes: {
          include: {
            orden: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('=== ANÁLISIS DETALLADO DE SERVICIOS ===');
    console.log(`Total de servicios en la base de datos: ${servicios.length}`);
    
    // Detalles de cada servicio
    for (const servicio of servicios) {
      console.log(`\n• Servicio: ${servicio.nombre} (ID: ${servicio.id})`);
      console.log(`  - Estado: ${servicio.estado}`);
      console.log(`  - Tipo: ${servicio.tipo}`);
      console.log(`  - Precio base: $${servicio.precioBase}`);
      console.log(`  - Creado: ${servicio.createdAt}`);
      console.log(`  - Última modificación: ${servicio.updatedAt}`);
      
      // Analizar órdenes que usan este servicio
      const órdenesAsociadas = servicio.ordenes;
      console.log(`  - Utilizado en ${órdenesAsociadas.length} orden(es):`);
      
      if (órdenesAsociadas.length > 0) {
        for (const ordenServicio of órdenesAsociadas) {
          console.log(`    • Orden #${ordenServicio.orden.id} - ${ordenServicio.orden.estado}`);
          console.log(`      Cantidad: ${ordenServicio.cantidad}, Precio unitario: $${ordenServicio.precioUnitario}`);
          console.log(`      Fecha: ${ordenServicio.orden.fecha}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error al analizar servicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarServicios(); 