document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado');
    console.log('Chart disponible:', typeof Chart !== 'undefined' ? 'SÍ' : 'NO');
    
    // Aquí puedes agregar la inicialización de otras funcionalidades del dashboard
    // Por ejemplo, cargar datos iniciales, configurar eventos, etc.
});

// Dashboard para la sección de Datos
const dashboardManager = {
    async cargarEstadisticas() {
        try {
            const response = await fetch('/api/dashboard/estadisticas', {
                headers: auth.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            // Datos de fallback para mostrar cuando hay error
            return {
                ordenes: {
                    total: 0,
                    pendientes: 0,
                    completadas: 0
                },
                servicios: {
                    total: 0,
                    activos: 0
                },
                usuarios: {
                    total: 0,
                    clientes: 0,
                    trabajadores: 0,
                    admins: 0
                },
                facturas: {
                    total: 0,
                    pendientes: 0,
                    pagadas: 0,
                    montoTotal: 0
                }
            };
        }
    },
    
    async cargarActividadReciente() {
        try {
            const response = await fetch('/api/dashboard/actividad', {
                headers: auth.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar actividad reciente');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al cargar actividad reciente:', error);
            return []; // Array vacío si hay error
        }
    },
    
    async cargarDatosGraficos() {
        try {
            const response = await fetch('/api/dashboard/graficos', {
                headers: auth.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar datos para gráficos');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al cargar datos para gráficos:', error);
            // Datos de fallback para los gráficos
            return {
                ordenesUltimos6Meses: [],
                serviciosMasVendidos: [],
                ingresosMensuales: []
            };
        }
    },
    
    async cargarEstadoSistema() {
        try {
            const response = await fetch('/api/dashboard/estado', {
                headers: auth.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar estado del sistema');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al cargar estado del sistema:', error);
            // Datos de fallback para el estado del sistema
            return {
                servidorActivo: true,
                baseDatosActiva: true,
                ultimoReinicio: new Date().toISOString()
            };
        }
    },
    
    // Función para generar datos ficticios mientras no hay API real
    generarDatosFicticios() {
        // Estadísticas
        const estadisticas = {
            ordenes: {
                total: Math.floor(Math.random() * 200) + 50,
                pendientes: Math.floor(Math.random() * 50) + 10,
                completadas: Math.floor(Math.random() * 150) + 30
            },
            servicios: {
                total: Math.floor(Math.random() * 30) + 5,
                activos: Math.floor(Math.random() * 25) + 5
            },
            usuarios: {
                total: Math.floor(Math.random() * 100) + 20,
                clientes: Math.floor(Math.random() * 80) + 15,
                trabajadores: Math.floor(Math.random() * 15) + 3,
                admins: Math.floor(Math.random() * 3) + 1
            },
            facturas: {
                total: Math.floor(Math.random() * 180) + 40,
                pendientes: Math.floor(Math.random() * 50) + 10,
                pagadas: Math.floor(Math.random() * 130) + 30,
                montoTotal: Math.floor(Math.random() * 50000) + 10000
            }
        };
        
        // Actividad reciente
        const tiposActividad = ['Nueva orden', 'Servicio completado', 'Factura generada', 'Pago recibido', 'Nuevo usuario'];
        const nombres = ['Juan Pérez', 'María López', 'Carlos Rodríguez', 'Ana Martínez', 'Luis González'];
        
        const actividad = [];
        for (let i = 0; i < 10; i++) {
            const horasAtras = Math.floor(Math.random() * 72);
            const fecha = new Date();
            fecha.setHours(fecha.getHours() - horasAtras);
            
            actividad.push({
                tipo: tiposActividad[Math.floor(Math.random() * tiposActividad.length)],
                usuario: nombres[Math.floor(Math.random() * nombres.length)],
                fecha: fecha.toISOString(),
                descripcion: `Actividad #${Math.floor(Math.random() * 1000)} realizada.`
            });
        }
        
        // Datos para gráficos
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
        const ordenesUltimos6Meses = meses.map(mes => ({
            mes,
            total: Math.floor(Math.random() * 40) + 5
        }));
        
        const serviciosMasVendidos = [
            { nombre: 'Mantenimiento Preventivo', cantidad: Math.floor(Math.random() * 50) + 20 },
            { nombre: 'Reparación', cantidad: Math.floor(Math.random() * 40) + 15 },
            { nombre: 'Instalación', cantidad: Math.floor(Math.random() * 30) + 10 },
            { nombre: 'Consultoría', cantidad: Math.floor(Math.random() * 20) + 5 },
            { nombre: 'Otros', cantidad: Math.floor(Math.random() * 10) + 5 }
        ];
        
        const ingresosMensuales = meses.map(mes => ({
            mes,
            ingreso: Math.floor(Math.random() * 8000) + 2000
        }));
        
        // Estado del sistema
        const estadoSistema = {
            servidorActivo: true,
            baseDatosActiva: true,
            ultimoReinicio: new Date(Date.now() - Math.floor(Math.random() * 864000000)).toISOString() // Entre 0 y 10 días atrás
        };
        
        return {
            estadisticas,
            actividad,
            graficos: {
                ordenesUltimos6Meses,
                serviciosMasVendidos,
                ingresosMensuales
            },
            estadoSistema
        };
    }
};

// Variable global para almacenar las instancias de los gráficos
let ordenesChart = null;
let serviciosChart = null;
let ingresosChart = null;

function crearGraficoOrdenes(datos) {
    const ctx = document.getElementById('ordenesChart');
    if (!ctx) {
        console.warn('No se encontró el canvas para el gráfico de órdenes');
        return;
    }

    // Destruir el gráfico existente si existe
    if (ordenesChart) {
        ordenesChart.destroy();
    }

    // Crear nuevo gráfico
    ordenesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.labels,
            datasets: [{
                label: 'Órdenes',
                data: datos.valores,
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: 'rgba(78, 115, 223, 1)',
                pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                tension: 0.3,
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function crearGraficoServicios(datos) {
    const ctx = document.getElementById('serviciosChart');
    if (!ctx) {
        console.warn('No se encontró el canvas para el gráfico de servicios');
        return;
    }

    // Destruir el gráfico existente si existe
    if (serviciosChart) {
        serviciosChart.destroy();
    }

    // Crear nuevo gráfico
    serviciosChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.labels,
            datasets: [{
                data: datos.valores,
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
                ],
                hoverBackgroundColor: [
                    '#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617'
                ],
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
}

function crearGraficoIngresos(datos) {
    const ctx = document.getElementById('ingresosChart');
    if (!ctx) {
        console.warn('No se encontró el canvas para el gráfico de ingresos');
        return;
    }

    // Destruir el gráfico existente si existe
    if (ingresosChart) {
        ingresosChart.destroy();
    }

    // Crear nuevo gráfico
    ingresosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.labels,
            datasets: [{
                label: 'Ingresos',
                data: datos.valores,
                backgroundColor: 'rgba(28, 200, 138, 0.05)',
                borderColor: 'rgba(28, 200, 138, 1)',
                pointBackgroundColor: 'rgba(28, 200, 138, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(28, 200, 138, 1)',
                tension: 0.3,
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Función para limpiar todos los gráficos
function limpiarGraficos() {
    if (ordenesChart) {
        ordenesChart.destroy();
        ordenesChart = null;
    }
    if (serviciosChart) {
        serviciosChart.destroy();
        serviciosChart = null;
    }
    if (ingresosChart) {
        ingresosChart.destroy();
        ingresosChart = null;
    }
}

// Función principal para cargar el dashboard
async function cargarDashboard() {
    console.log('Función cargarDashboard ejecutándose...');
    console.log('Chart disponible:', typeof Chart !== 'undefined' ? 'SÍ' : 'NO');
    
    try {
        // Limpiar gráficos existentes antes de cargar nuevos
        limpiarGraficos();
        
        const container = document.getElementById('datos');
        if (!container) {
            console.error('No se encontró el contenedor de datos');
            return;
        }
        
        console.log('Contenedor datos encontrado:', container);
        
        // Mostrar contenedor de carga
        container.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2" id="datosTitle">Dashboard</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <button id="refreshDashboard" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            </div>
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando datos del dashboard...</p>
            </div>
        `;
        
        // Cargar datos reales del API
        const [estadisticas, actividad, datosGraficos, estadoSistema] = await Promise.all([
            dashboardManager.cargarEstadisticas(),
            dashboardManager.cargarActividadReciente(),
            dashboardManager.cargarDatosGraficos(),
            dashboardManager.cargarEstadoSistema()
        ]);
        
        // USAR DATOS FICTICIOS MIENTRAS NO HAY API
        // const datos = dashboardManager.generarDatosFicticios();
        // const estadisticas = datos.estadisticas;
        // const actividad = datos.actividad;
        // const datosGraficos = datos.graficos;
        // const estadoSistema = datos.estadoSistema;
        
        // Agregar estructura del dashboard
        container.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2" id="datosTitle">Dashboard</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <button id="refreshDashboard" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            </div>
            
            <!-- Tarjetas de estadísticas -->
            <div class="row mb-4">
                <div class="col-md-3 mb-4">
                    <div class="card border-left-primary h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Órdenes Totales</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">${estadisticas.ordenes.total}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card border-left-success h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Ingresos Totales</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">$${estadisticas.facturas.montoTotal.toLocaleString()}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card border-left-info h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Usuarios Registrados</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">${estadisticas.usuarios.total}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-users fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card border-left-warning h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Servicios Activos</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">${estadisticas.servicios.activos}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-tools fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Gráficos -->
            <div class="row mb-4">
                <div class="col-md-8 mb-4">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Órdenes de los últimos 6 meses</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-area">
                                <canvas id="ordenesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4 mb-4">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Servicios más vendidos</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-pie">
                                <canvas id="serviciosChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráfico de Ingresos -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Ingresos Mensuales</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-area">
                                <canvas id="ingresosChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Actividad reciente y Estado del sistema -->
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Actividad Reciente</h6>
                        </div>
                        <div class="card-body">
                            <div class="activity-stream">
                                ${actividad.map(item => `
                                    <div class="activity-item mb-3 pb-3 border-bottom">
                                        <div class="d-flex align-items-center mb-1">
                                            <span class="badge bg-info me-2">${item.tipo}</span>
                                            <small class="text-muted">${new Date(item.fecha).toLocaleString()}</small>
                                        </div>
                                        <p class="mb-0">${item.descripcion} - <strong>${item.usuario}</strong></p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Estado del Sistema</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-3">
                                <span>Servidor:</span>
                                <span class="badge ${estadoSistema.servidorActivo ? 'bg-success' : 'bg-danger'}">
                                    ${estadoSistema.servidorActivo ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                            <div class="d-flex justify-content-between mb-3">
                                <span>Base de Datos:</span>
                                <span class="badge ${estadoSistema.baseDatosActiva ? 'bg-success' : 'bg-danger'}">
                                    ${estadoSistema.baseDatosActiva ? 'ACTIVA' : 'INACTIVA'}
                                </span>
                            </div>
                            <div class="d-flex justify-content-between mb-3">
                                <span>Último reinicio:</span>
                                <span>${new Date(estadoSistema.ultimoReinicio).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Detalle de Órdenes en progreso -->
                    <div class="card shadow mb-4">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Órdenes en Progreso</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-3">
                                <span>Pendientes:</span>
                                <span class="badge bg-warning">${estadisticas.ordenes.pendientes}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-3">
                                <span>Completadas:</span>
                                <span class="badge bg-success">${estadisticas.ordenes.completadas}</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: ${(estadisticas.ordenes.completadas / estadisticas.ordenes.total * 100).toFixed(1)}%" 
                                     aria-valuenow="${estadisticas.ordenes.completadas}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="${estadisticas.ordenes.total}">
                                    ${(estadisticas.ordenes.completadas / estadisticas.ordenes.total * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar evento para actualizar el dashboard
        document.getElementById('refreshDashboard').addEventListener('click', function() {
            cargarDashboard();
        });
        
        // Cargar gráficos una vez que el DOM esté listo
        setTimeout(() => {
            // Preparar datos para los gráficos
            const datosOrdenes = {
                labels: datosGraficos.ordenesUltimos6Meses.map(d => d.mes),
                valores: datosGraficos.ordenesUltimos6Meses.map(d => d.total)
            };
            
            const datosServicios = {
                labels: datosGraficos.serviciosMasVendidos.map(d => d.nombre),
                valores: datosGraficos.serviciosMasVendidos.map(d => d.cantidad)
            };
            
            const datosIngresos = {
                labels: datosGraficos.ingresosMensuales.map(d => d.mes),
                valores: datosGraficos.ingresosMensuales.map(d => d.ingreso)
            };

            // Crear los gráficos usando las funciones definidas
            crearGraficoOrdenes(datosOrdenes);
            crearGraficoServicios(datosServicios);
            crearGraficoIngresos(datosIngresos);
        }, 100);

    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        const container = document.getElementById('datos');
        if (container) {
            container.innerHTML = `
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2" id="datosTitle">Dashboard</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <button id="refreshDashboard" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-sync-alt"></i> Reintentar
                        </button>
                    </div>
                </div>
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Error al cargar el dashboard. 
                    <button class="btn btn-danger btn-sm ms-3" id="retryDashboard">Reintentar</button>
                </div>
            `;
            
            document.getElementById('refreshDashboard').addEventListener('click', cargarDashboard);
            document.getElementById('retryDashboard').addEventListener('click', cargarDashboard);
        }
    }
}

// Exponer la función al ámbito global
window.cargarDashboard = cargarDashboard;

// Inicializar directamente si la sección de datos está activa al cargar la página
if (document.getElementById('datos') && document.getElementById('datos').classList.contains('active')) {
    console.log('Sección datos está activa, cargando dashboard inmediatamente...');
    setTimeout(cargarDashboard, 100); // Pequeño retraso para asegurar que todo esté listo
}
