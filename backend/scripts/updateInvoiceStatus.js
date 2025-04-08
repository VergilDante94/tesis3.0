const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarFacturasExistentes() {
    try {
        console.log('Iniciando actualización de facturas...');
        
        // Primero, mostrar todas las órdenes para verificar sus estados
        const ordenes = await prisma.orden.findMany();
        console.log('Estados de órdenes disponibles:');
        ordenes.forEach(orden => {
            console.log(`Orden ${orden.id}: Estado = ${orden.estado}`);
        });
        
        // Obtener todas las facturas con sus órdenes
        const facturas = await prisma.factura.findMany({
            include: {
                orden: true
            }
        });
        
        console.log(`\nEncontramos ${facturas.length} facturas para actualizar...`);
        
        // Mostrar detalle de cada factura antes de actualizar
        facturas.forEach(factura => {
            console.log(`Factura ${factura.id}: Estado actual = ${factura.estado}, Orden ${factura.ordenId} (${factura.orden ? factura.orden.estado : 'No encontrada'})`);
        });
        
        let actualizadas = 0;
        
        // Procesar cada factura
        for (const factura of facturas) {
            if (factura.orden) {
                let nuevoEstado = factura.estado;
                
                // Determinar el estado basado en el estado de la orden
                if (factura.orden.estado === 'REALIZADO' || factura.orden.estado === 'COMPLETADA') {
                    nuevoEstado = 'PAGADA';
                } else if (factura.orden.estado === 'CANCELADA') {
                    nuevoEstado = 'CANCELADA';
                } else {
                    nuevoEstado = 'PENDIENTE';
                }
                
                console.log(`Factura ${factura.id}: Estado orden = ${factura.orden.estado}, Estado actual = ${factura.estado}, Nuevo estado = ${nuevoEstado}`);
                
                // Solo actualizar si el estado cambió
                if (nuevoEstado !== factura.estado) {
                    await prisma.factura.update({
                        where: { id: factura.id },
                        data: { estado: nuevoEstado }
                    });
                    
                    console.log(`✅ Factura ${factura.id} actualizada de '${factura.estado}' a '${nuevoEstado}'`);
                    actualizadas++;
                } else {
                    console.log(`ℹ️ Factura ${factura.id} ya tiene el estado correcto: ${factura.estado}`);
                }
            } else {
                console.log(`⚠️ Factura ${factura.id} no tiene orden asociada`);
            }
        }
        
        // Mostrar facturas después de actualizar
        console.log('\nVerificando estados finales:');
        const facturasActualizadas = await prisma.factura.findMany({
            include: {
                orden: true
            }
        });
        
        facturasActualizadas.forEach(factura => {
            console.log(`Factura ${factura.id}: Estado final = ${factura.estado}, Orden ${factura.ordenId} (${factura.orden ? factura.orden.estado : 'No encontrada'})`);
        });
        
        console.log(`\n✨ Proceso completado. ${actualizadas} facturas actualizadas.`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la función
actualizarFacturasExistentes().then(() => {
    console.log('Script finalizado');
}); 