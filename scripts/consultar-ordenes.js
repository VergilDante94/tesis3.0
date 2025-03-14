// Script para consultar órdenes y su relación con servicios
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function consultarOrdenes() {
  try {
    // Obtener todas las órdenes con sus detalles y servicios
    const ordenes = await prisma.orden.findMany({
      include: {
        servicios: {
          include: {
            servicio: true
          }
        },
        cliente: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('=== ÓRDENES EN LA BASE DE DATOS ===');
    console.log(`Total de órdenes: ${ordenes.length}`);
    
    // Análisis detallado de las órdenes y servicios
    for (const orden of ordenes) {
      console.log(`\nOrden #${orden.id} - Estado: ${orden.estado}`);
      console.log(`Cliente: ${orden.cliente?.usuario?.nombre || 'No especificado'}`);
      console.log(`Fecha: ${orden.fecha}`);
      console.log('Servicios incluidos:');
      
      if (orden.servicios.length === 0) {
        console.log('  - Ningún servicio asociado');
      } else {
        // Listar servicios en la orden
        orden.servicios.forEach(detalle => {
          console.log(`  - ${detalle.servicio.nombre} (ID: ${detalle.servicio.id})`);
          console.log(`    Cantidad: ${detalle.cantidad}, Precio unitario: $${detalle.precioUnitario}`);
        });
      }
    }

    // Analizar qué servicios están siendo utilizados en órdenes
    const serviciosUsados = new Set();
    ordenes.forEach(orden => {
      orden.servicios.forEach(detalle => {
        serviciosUsados.add(detalle.servicioId);
      });
    });
    
    console.log('\n=== ANÁLISIS DE SERVICIOS EN USO ===');
    console.log(`Servicios utilizados en órdenes: ${serviciosUsados.size}`);
    console.log('IDs de servicios en uso:', [...serviciosUsados]);
    
  } catch (error) {
    console.error('Error al consultar órdenes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consultarOrdenes(); 