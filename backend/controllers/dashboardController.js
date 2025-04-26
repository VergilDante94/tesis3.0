const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logInfo, logError } = require('../utils/logger');

/**
 * Obtiene las estadísticas generales del sistema para mostrar en el dashboard
 */
const obtenerEstadisticas = async (req, res) => {
    try {
        logInfo('Obteniendo estadísticas para dashboard');
        
        // Obtener total de órdenes y contar por estado
        const totalOrdenes = await prisma.orden.count();
        const ordenesPendientes = await prisma.orden.count({
            where: { estado: 'PENDIENTE' }
        });
        const ordenesCompletadas = await prisma.orden.count({
            where: { estado: 'REALIZADO' }
        });
        
        // Obtener información de servicios
        const totalServicios = await prisma.servicio.count();
        const serviciosActivos = await prisma.servicio.count({
            where: { estado: 'ACTIVO' }
        });
        
        // Obtener información de usuarios
        const totalUsuarios = await prisma.usuario.count();
        const totalClientes = await prisma.usuario.count({
            where: { tipo: 'CLIENTE' }
        });
        const totalTrabajadores = await prisma.usuario.count({
            where: { tipo: 'TRABAJADOR' }
        });
        const totalAdmins = await prisma.usuario.count({
            where: { tipo: 'ADMIN' }
        });
        
        // Obtener información de facturas
        const totalFacturas = await prisma.factura.count();
        const facturasPendientes = await prisma.factura.count({
            where: { estado: 'PENDIENTE' }
        });
        const facturasPagadas = await prisma.factura.count({
            where: { estado: 'PAGADA' }
        });
        
        // Calcular monto total de facturas
        const montoFacturas = await prisma.factura.aggregate({
            _sum: {
                total: true
            }
        });
        
        const estadisticas = {
            ordenes: {
                total: totalOrdenes,
                pendientes: ordenesPendientes,
                completadas: ordenesCompletadas
            },
            servicios: {
                total: totalServicios,
                activos: serviciosActivos
            },
            usuarios: {
                total: totalUsuarios,
                clientes: totalClientes,
                trabajadores: totalTrabajadores,
                admins: totalAdmins
            },
            facturas: {
                total: totalFacturas,
                pendientes: facturasPendientes,
                pagadas: facturasPagadas,
                montoTotal: montoFacturas._sum.total || 0
            }
        };
        
        logInfo('Estadísticas obtenidas correctamente:', estadisticas);
        return res.status(200).json(estadisticas);
    } catch (error) {
        logError('Error al obtener estadísticas:', error);
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

/**
 * Obtiene la actividad reciente del sistema (últimas órdenes, facturas, etc.)
 */
const obtenerActividadReciente = async (req, res) => {
    try {
        logInfo('Obteniendo actividad reciente para dashboard');
        
        // Obtener últimas órdenes creadas
        const ultimasOrdenes = await prisma.orden.findMany({
            take: 5,
            orderBy: { fecha: 'desc' },
            include: {
                cliente: {
                    include: {
                        usuario: {
                            select: {
                                nombre: true
                            }
                        }
                    }
                }
            }
        });
        
        // Obtener últimas facturas generadas
        const ultimasFacturas = await prisma.factura.findMany({
            take: 5,
            orderBy: { fechaEmision: 'desc' },
            include: {
                orden: {
                    include: {
                        cliente: {
                            include: {
                                usuario: {
                                    select: {
                                        nombre: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        // Combinar y ordenar por fecha
        const actividad = [
            ...ultimasOrdenes.map(orden => ({
                tipo: 'Nueva orden',
                fecha: orden.fecha,
                usuario: orden.cliente?.usuario?.nombre || 'Usuario desconocido',
                descripcion: `Orden #${orden.id} creada con estado ${orden.estado}`
            })),
            ...ultimasFacturas.map(factura => ({
                tipo: 'Factura generada',
                fecha: factura.fechaEmision,
                usuario: factura.orden?.cliente?.usuario?.nombre || 'Usuario desconocido',
                descripcion: `Factura #${factura.id} por $${factura.total} generada`
            }))
        ];
        
        // Ordenar por fecha (más reciente primero)
        actividad.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Limitar a 10 actividades
        const actividadLimitada = actividad.slice(0, 10);
        
        logInfo(`Se encontraron ${actividadLimitada.length} actividades recientes`);
        return res.status(200).json(actividadLimitada);
    } catch (error) {
        logError('Error al obtener actividad reciente:', error);
        return res.status(500).json({ error: 'Error al obtener actividad reciente' });
    }
};

/**
 * Obtiene los datos para mostrar en los gráficos del dashboard
 */
const obtenerDatosGraficos = async (req, res) => {
    try {
        logInfo('Obteniendo datos para gráficos del dashboard');
        
        // Obtener órdenes por mes (últimos 6 meses)
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 5); // 6 meses atrás (incluyendo el actual)
        fechaInicio.setDate(1); // Primer día del mes
        fechaInicio.setHours(0, 0, 0, 0); // Inicio del día
        
        // Obtener órdenes creadas después de la fecha de inicio
        const ordenes = await prisma.orden.findMany({
            where: {
                fecha: {
                    gte: fechaInicio
                }
            },
            select: {
                fecha: true
            }
        });
        
        // Agrupar órdenes por mes
        const ordenesPorMes = {};
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        // Inicializar conteo para los últimos 6 meses
        const hoy = new Date();
        for (let i = 0; i < 6; i++) {
            const mes = new Date();
            mes.setMonth(hoy.getMonth() - i);
            const mesKey = `${mes.getFullYear()}-${mes.getMonth() + 1}`;
            const mesNombre = mesesNombres[mes.getMonth()];
            ordenesPorMes[mesKey] = { mes: mesNombre, total: 0 };
        }
        
        // Contar órdenes por mes
        ordenes.forEach(orden => {
            const fecha = new Date(orden.fecha);
            const mesKey = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
            if (ordenesPorMes[mesKey]) {
                ordenesPorMes[mesKey].total++;
            }
        });
        
        // Convertir a array y ordenar por fecha (más antiguos primero)
        const ordenesUltimos6Meses = Object.values(ordenesPorMes).reverse();
        
        // Obtener servicios más utilizados
        const serviciosUsados = await prisma.ordenServicio.groupBy({
            by: ['servicioId'],
            _count: {
                servicioId: true
            },
            orderBy: {
                _count: {
                    servicioId: 'desc'
                }
            },
            take: 5
        });
        
        // Obtener detalles de los servicios
        const serviciosIds = serviciosUsados.map(s => s.servicioId);
        const serviciosDetalles = await prisma.servicio.findMany({
            where: {
                id: {
                    in: serviciosIds
                }
            },
            select: {
                id: true,
                nombre: true
            }
        });
        
        // Mapear IDs a nombres y cantidades
        const serviciosMasVendidos = serviciosUsados.map(s => {
            const detalle = serviciosDetalles.find(d => d.id === s.servicioId);
            return {
                nombre: detalle ? detalle.nombre : `Servicio ${s.servicioId}`,
                cantidad: s._count.servicioId
            };
        });
        
        // Calcular ingresos mensuales basados en facturas
        const facturas = await prisma.factura.findMany({
            where: {
                fechaEmision: {
                    gte: fechaInicio
                }
            },
            select: {
                fechaEmision: true,
                total: true
            }
        });
        
        // Agrupar facturas por mes
        const ingresosPorMes = {};
        
        // Inicializar ingresos para los últimos 6 meses
        for (let i = 0; i < 6; i++) {
            const mes = new Date();
            mes.setMonth(hoy.getMonth() - i);
            const mesKey = `${mes.getFullYear()}-${mes.getMonth() + 1}`;
            const mesNombre = mesesNombres[mes.getMonth()];
            ingresosPorMes[mesKey] = { mes: mesNombre, ingreso: 0 };
        }
        
        // Sumar ingresos por mes
        facturas.forEach(factura => {
            const fecha = new Date(factura.fechaEmision);
            const mesKey = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
            if (ingresosPorMes[mesKey]) {
                ingresosPorMes[mesKey].ingreso += factura.total;
            }
        });
        
        // Convertir a array y ordenar por fecha (más antiguos primero)
        const ingresosMensuales = Object.values(ingresosPorMes).reverse();
        
        const datosGraficos = {
            ordenesUltimos6Meses,
            serviciosMasVendidos,
            ingresosMensuales
        };
        
        logInfo('Datos para gráficos obtenidos correctamente');
        return res.status(200).json(datosGraficos);
    } catch (error) {
        logError('Error al obtener datos para gráficos:', error);
        return res.status(500).json({ error: 'Error al obtener datos para gráficos' });
    }
};

/**
 * Obtiene el estado del sistema
 */
const obtenerEstadoSistema = async (req, res) => {
    try {
        logInfo('Obteniendo estado del sistema para dashboard');
        
        // En un entorno real, aquí obtendrías información real del servidor
        // Como uso de memoria, disco, etc. Por ahora simulamos con datos
        
        // Verificamos que la BD esté activa haciendo una consulta simple
        const dbActiva = await prisma.$queryRaw`SELECT 1 as healthCheck`;
        const baseDatosActiva = dbActiva && dbActiva.length > 0;
        
        // Obtener información del sistema
        const estadoSistema = {
            servidorActivo: true, // El servidor está activo si podemos responder
            baseDatosActiva: baseDatosActiva,
            ultimoReinicio: process.env.SERVER_START_TIME || new Date().toISOString(),
            espacioDisponible: "Estimado: > 500 GB", // En un entorno real, esto se consultaría al sistema
            memoria: "Disponible: > 2 GB" // En un entorno real, esto se consultaría al sistema
        };
        
        logInfo('Estado del sistema obtenido correctamente');
        return res.status(200).json(estadoSistema);
    } catch (error) {
        logError('Error al obtener estado del sistema:', error);
        // Aún si hay error, respondemos para mostrar que al menos el servidor está activo
        return res.status(200).json({ 
            servidorActivo: true,
            baseDatosActiva: false,
            ultimoReinicio: process.env.SERVER_START_TIME || new Date().toISOString(),
            espacioDisponible: "Error al obtener información",
            memoria: "Error al obtener información"
        });
    }
};

module.exports = {
    obtenerEstadisticas,
    obtenerActividadReciente,
    obtenerDatosGraficos,
    obtenerEstadoSistema
}; 