// Script para consultar servicios
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function consultarServicios() {
  try {
    const servicios = await prisma.servicio.findMany({
      orderBy: { 
        id: 'asc' 
      }
    });
    
    console.log('=== SERVICIOS EN LA BASE DE DATOS ===');
    console.log(JSON.stringify(servicios, null, 2));
    console.log(`Total de servicios: ${servicios.length}`);
    
    // Resumir los servicios activos
    const serviciosActivos = servicios.filter(s => s.estado === 'ACTIVO');
    console.log(`\nServicios activos: ${serviciosActivos.length}`);
    
    // Resumir por tipo
    const porHora = servicios.filter(s => s.tipo === 'POR_HORA').length;
    const porCantidad = servicios.filter(s => s.tipo === 'POR_CANTIDAD').length;
    console.log(`\nDistribución por tipo:`);
    console.log(`- Por hora: ${porHora}`);
    console.log(`- Por cantidad: ${porCantidad}`);
  } catch (error) {
    console.error('Error al consultar servicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consultarServicios(); 