// Función principal para mostrar la vista de órdenes
function mostrarVistaOrdenes() {
    console.log('Inicializando vista de órdenes...');
    
    // Inicializar filtros adicionales
    inicializarFiltrosOrdenes();
    
    // Crear contenedor de alertas si no existe
    let alertasContainer = document.getElementById('alertas');
    if (!alertasContainer) {
        alertasContainer = document.createElement('div');
        alertasContainer.id = 'alertas';
        alertasContainer.className = 'position-fixed top-0 end-0 p-3';
        alertasContainer.style.zIndex = '1050';
        document.body.appendChild(alertasContainer);
    }
    
    // Asignar eventos a botones de filtros
    const btnLimpiarFiltros = document.getElementById('limpiarFiltros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }
    
    const btnAplicarFiltros = document.getElementById('aplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }
    
    // Verificar que el botón de nueva orden esté conectado a la función correcta
    const btnNuevaOrden = document.querySelector('button[onclick="nuevaOrden()"]');
    if (btnNuevaOrden && !btnNuevaOrden.onclick) {
        // Solo asignar si no tiene un manejador ya configurado
        console.log('Configurando evento para botón de nueva orden');
        btnNuevaOrden.onclick = nuevaOrden;
    }
    
    // Cargar las órdenes
    mostrarListaOrdenes();
    
    // Configurar el método de filtrado si el formulario existe
    const filtroOrdenesForm = document.getElementById('filtroOrdenesForm');
    if (filtroOrdenesForm) {
        filtroOrdenesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            aplicarFiltros();
        });
    }
}

// Inicializar filtros específicos para órdenes
function inicializarFiltrosOrdenes() {
    // Verificar si ya existe el filtro de tipo
    const filtroTipoExistente = document.getElementById('filtroTipo');
    if (!filtroTipoExistente) {
        // Crear el filtro de tipo si no existe
        const filtrosContainer = document.querySelector('.filtros-container');
        if (filtrosContainer) {
            const filtroEstado = document.getElementById('filtroEstado');
            if (filtroEstado) {
                // Insertar después del filtro de estado
                const filtroTipoHTML = `
                    <div class="col-md-3 mb-3">
                        <label for="filtroTipo" class="form-label">Tipo de Orden</label>
                        <select id="filtroTipo" class="form-select">
                            <option value="">Todos los tipos</option>
                            <option value="SERVICIO">Servicios</option>
                            <option value="COMPRA">Compras</option>
                        </select>
                </div>
            `;

                filtroEstado.closest('.col-md-3').insertAdjacentHTML('afterend', filtroTipoHTML);
                
                // Registrar el evento para el nuevo filtro
                document.getElementById('filtroTipo')?.addEventListener('change', aplicarFiltros);
            }
        }
    }
}

// Función para aplicar filtros
function aplicarFiltros() {
    const estado = document.getElementById('filtroEstado')?.value;
    const tipo = document.getElementById('filtroTipo')?.value;
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value;
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value;
    
    console.log('Aplicando filtros:', { estado, tipo, fechaDesde, fechaHasta });
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo = tipo;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;
    
    // Llamada a la función para mostrar órdenes con filtros
    mostrarListaOrdenes(filtros);
}

// Función para limpiar filtros
function limpiarFiltros() {
    console.log('Limpiando filtros');
    
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroFechaDesde = document.getElementById('filtroFechaDesde');
    const filtroFechaHasta = document.getElementById('filtroFechaHasta');
    
    if (filtroEstado) filtroEstado.value = '';
    if (filtroTipo) filtroTipo.value = '';
    if (filtroFechaDesde) filtroFechaDesde.value = '';
    if (filtroFechaHasta) filtroFechaHasta.value = '';
    
    // Recargar órdenes sin filtros
    mostrarListaOrdenes();
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
    console.log(`Mostrando alerta: ${mensaje} (${tipo})`);
    
    // Buscar o crear el contenedor de alertas
    let alertasContainer = document.getElementById('alertas');
    if (!alertasContainer) {
        alertasContainer = document.createElement('div');
        alertasContainer.id = 'alertas';
        alertasContainer.className = 'position-fixed top-0 end-0 p-3';
        alertasContainer.style.zIndex = '1050';
        document.body.appendChild(alertasContainer);
    }
    
    const alertId = `alerta-${Date.now()}`;
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
    `;
    
    alertasContainer.innerHTML += alertHTML;
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        const alertaElement = document.getElementById(alertId);
        if (alertaElement) {
            alertaElement.remove();
        }
    }, 5000);
}

// Función para obtener la clase de badge según el estado
function getEstadoBadgeClass(estado) {
    switch (estado?.toUpperCase()) {
        case 'PENDIENTE':
            return 'bg-warning text-dark';
        case 'PROGRAMADA':
            return 'bg-info';
        case 'EN_PROCESO':
            return 'bg-primary';
        case 'COMPLETADA':
            return 'bg-success';
        case 'CANCELADA':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Función para mostrar lista de órdenes con filtros opcionales
async function mostrarListaOrdenes(filtros = {}) {
    console.log('Mostrando lista de órdenes con filtros:', filtros);
    
    // Mostrar indicador de carga
    const ordenesContainer = document.getElementById('listaOrdenes');
    if (!ordenesContainer) {
        console.error('No se encontró el contenedor de órdenes');
            return;
        }

    ordenesContainer.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando órdenes...</span>
            </div>
        </div>
    `;
    
    try {
        // Construir URL con filtros
        let url = '/api/ordenes';
        const params = new URLSearchParams();
        
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.tipo) params.append('tipo', filtros.tipo);
        if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        // Realizar petición
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al cargar órdenes: ${response.status}`);
        }
        
        const ordenes = await response.json();
        
        if (!Array.isArray(ordenes) || ordenes.length === 0) {
            ordenesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay órdenes disponibles con los filtros seleccionados.
            </div>
        `;
        return;
    }

        // Generar HTML para cada orden
        const ordenesHTML = ordenes.map(orden => {
            // Determinar si es una orden de servicio o una compra
            const esCompra = orden.tipo === 'COMPRA';
            const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
            const esAdmin = usuario.tipo === 'ADMIN';
            
            // Formatear los detalles según el tipo de orden
            let detallesTexto = '';
            
            if (esCompra) {
                // Para compras, mostrar productos
                if (orden.detalles && orden.detalles.length > 0) {
                    detallesTexto = orden.detalles.map(d => `${d.producto?.nombre || d.productoNombre || 'Producto'} (${d.cantidad})`).join(', ');
                } else if (orden.descripcion) {
                    // Intentar extraer información de la descripción si no hay detalles
                    try {
                        // Intentamos extraer con el formato específico "Nx Producto"
                        const productosRegex = /(\d+)x\s+([^,\n:]+)/g;
                        let match;
                        const productosEncontrados = [];
                        
                        // Extraer productos con el formato "Nx NombreProducto"
                        while ((match = productosRegex.exec(orden.descripcion)) !== null) {
                            productosEncontrados.push(`${match[2].trim()} (${match[1]})`);
                        }
                        
                        if (productosEncontrados.length > 0) {
                            detallesTexto = productosEncontrados.join(', ');
    } else {
                            // Si no se encontraron productos con el formato específico,
                            // usar la descripción directamente
                                const descripcionLimpia = orden.descripcion.replace('Compra de productos:', '').trim();
                                detallesTexto = descripcionLimpia || 'Productos no especificados';
                        }
                    } catch (error) {
                        console.error("Error al extraer productos de la descripción:", error);
                        detallesTexto = 'Error al procesar los productos';
                    }
                } else {
                    detallesTexto = 'Productos no especificados';
                }
            } else {
                // Para servicios, mostrar servicios
                detallesTexto = orden.servicios?.map(s => s.servicio?.nombre || 'Servicio').join(', ') || 'Sin servicios';
            }
            
            // Formatear fecha
            const fechaFormateada = orden.fechaProgramada || orden.fecha 
                ? new Date(orden.fechaProgramada || orden.fecha).toLocaleDateString() 
                : 'Sin fecha registrada';
            
            // Formatear total
            const total = orden.total || orden.precios?.total || 0;
            const totalFormateado = total.toLocaleString('es-ES', { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 2 
                }).replace('US$', '$');
            
                return `
            <div class="card mb-3" data-orden-id="${orden.id}">
                <div class="card-header d-flex justify-content-between align-items-center bg-light">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-primary me-2">Orden #${orden.id}</span>
                        <span class="badge ${getEstadoBadgeClass(orden.estado)}">${orden.estado}</span>
                        ${esCompra ? '<span class="badge bg-info ms-2">Compra</span>' : '<span class="badge bg-secondary ms-2">Servicio</span>'}
                        </div>
                    <div class="btn-group">
                        ${orden.estado === 'PENDIENTE' ? 
                        `<button class="btn btn-sm btn-outline-danger cancelar-orden" 
                                data-orden-id="${orden.id}">
                            <i class="fas fa-times-circle"></i>
                        </button>` : ''}
                        <button class="btn btn-sm btn-outline-primary ver-detalle-orden" 
                                data-orden-id="${orden.id}">
                            <i class="fas fa-eye"></i> Detalles
                        </button>
                        ${esAdmin ? `
                        <button class="btn btn-sm btn-outline-danger eliminar-orden" 
                                data-orden-id="${orden.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                        </div>
                    </div>
                <div class="card-body py-2">
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <h6 class="mb-0">Cliente: ${orden.cliente?.usuario?.nombre || 'N/A'}</h6>
                            <small class="d-block text-muted">
                                <strong>Fecha:</strong> ${fechaFormateada}
                            </small>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h5 class="text-primary mb-0">${totalFormateado}</h5>
                        </div>
                    </div>
                    <div class="servicios-resumen">
                        <small>
                            <strong>${esCompra ? 'Productos:' : 'Servicios:'}</strong> 
                            ${detallesTexto}
                        </small>
                    </div>
                </div>
        </div>
    `;
        }).join('');

        // Actualizar el contenedor con todas las ordenes generadas
        ordenesContainer.innerHTML = ordenesHTML;
        
        // Añadir eventos para ver detalles
        document.querySelectorAll('.ver-detalle-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const boton = e.target.closest('.ver-detalle-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    mostrarDetalleOrden(ordenId);
                }
            });
        });
        
        // Añadir eventos para cancelar órdenes
        document.querySelectorAll('.cancelar-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const boton = e.target.closest('.cancelar-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    confirmarCancelarOrden(ordenId);
                }
            });
        });

        // Añadir eventos para eliminar órdenes
        document.querySelectorAll('.eliminar-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const boton = e.target.closest('.eliminar-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    confirmarEliminarOrden(ordenId);
                }
            });
        });
        
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        ordenesContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                Error al cargar las órdenes: ${error.message}
            </div>
        `;
    }
}

// Función para mostrar detalle de una orden
async function mostrarDetalleOrden(ordenId) {
    console.log('=== Inicio mostrarDetalleOrden ===');
    console.log('ID de orden:', ordenId);
    
    if (!ordenId || isNaN(parseInt(ordenId))) {
        console.error('ID de orden inválido:', ordenId);
        mostrarAlerta('ID de orden inválido', 'danger');
        return;
    }
    
    // Verificar si existe el contenedor de detalles o crearlo
    let detalleContainer = document.getElementById('detalleOrdenContainer');
    if (!detalleContainer) {
        // Crear el contenedor si no existe
        detalleContainer = document.createElement('div');
        detalleContainer.id = 'detalleOrdenContainer';
        detalleContainer.className = 'detalle-orden-floating';
        detalleContainer.style.position = 'fixed';
        detalleContainer.style.top = '50%';
        detalleContainer.style.left = '50%';
        detalleContainer.style.transform = 'translate(-50%, -50%)';
        detalleContainer.style.zIndex = '1050';
        detalleContainer.style.backgroundColor = 'white';
        detalleContainer.style.borderRadius = '8px';
        detalleContainer.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        detalleContainer.style.padding = '0';
        detalleContainer.style.width = '90%';
        detalleContainer.style.maxWidth = '800px';
        detalleContainer.style.maxHeight = '90vh';
        detalleContainer.style.overflowY = 'auto';
        
        document.body.appendChild(detalleContainer);
        
        // Crear el overlay para el fondo oscuro
        const overlay = document.createElement('div');
        overlay.id = 'detalleOrdenOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '1040';
        
        // Agregar evento para cerrar al hacer clic en el overlay
        overlay.addEventListener('click', cerrarDetalleOrden);
        
        document.body.appendChild(overlay);
    }
    
    // Mostrar indicador de carga
    detalleContainer.innerHTML = `
        <div class="p-3">
            <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando detalle de la orden...</span>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar el contenedor y overlay
    document.getElementById('detalleOrdenContainer').style.display = 'block';
    document.getElementById('detalleOrdenOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevenir scroll en el fondo
    
    try {
        // Obtener detalle de la orden
        const token = localStorage.getItem('token');
        console.log('Obteniendo detalles de la orden desde la API...');
        
        const response = await fetch(`/api/ordenes/${ordenId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al cargar detalle de la orden: ${response.status}`);
        }
        
        const detalle = await response.json();
        console.log('Detalle de orden recibido:', detalle);
        console.log('Tipo de orden:', detalle.tipo);
        console.log('Estado de orden:', detalle.estado);
        
        // Si es una orden de compra, intentar obtener productos
        if (detalle.tipo === 'COMPRA') {
            console.log('=== Procesando orden de compra ===');
            console.log('Descripción de la orden:', detalle.descripcion);
            
            if (detalle.detalles && detalle.detalles.length > 0) {
                console.log('Detalles de productos encontrados:', detalle.detalles);
            } else {
                console.log('No se encontraron detalles de productos estructurados');
            }
        }

        // Log para el cálculo de totales
        console.log('=== Cálculo de totales ===');
        const total = detalle.total || detalle.precios?.total || 0;
        console.log('Total de la orden:', total);
        console.log('Precios en detalle:', detalle.precios);
        
        if (!detalle) {
            detalleContainer.innerHTML = `
                <div class="p-3">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        No hay detalles disponibles para esta orden.
                    </div>
                </div>
                <div class="border-top p-3 text-end">
                    <button type="button" class="btn btn-secondary" id="btnCerrarDetalleOrden">Cerrar</button>
                </div>
            `;
            document.getElementById('btnCerrarDetalleOrden').addEventListener('click', cerrarDetalleOrden);
            return;
        }
        
        // Formatear fechas
        const fechaCreacion = detalle.createdAt ? new Date(detalle.createdAt).toLocaleString() : 'Sin fecha';
        const fechaProgramada = detalle.fechaProgramada ? new Date(detalle.fechaProgramada).toLocaleString() : 'No programada';
            
        // Determinar si es una orden de compra o servicio
        const esCompra = detalle.tipo === 'COMPRA';
        console.log('Es orden de compra:', esCompra);
        
        // Formatear total
        const totalFormateado = total.toLocaleString('es-ES', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2 
        }).replace('US$', '$');
        console.log('Total formateado:', totalFormateado);
        
        // Preparar descripción
        let descripcionDetalle = '';
        
        if (esCompra) {
            if (detalle.descripcion) {
                descripcionDetalle = detalle.descripcion;
            } else if (detalle.detalles && detalle.detalles.length > 0) {
                const productosStr = detalle.detalles.map(item => 
                    `${item.cantidad}x ${item.producto?.nombre || item.productoNombre || 'Producto'}`
                ).join(', ');
                descripcionDetalle = `Compra de productos: ${productosStr}`;
            } else {
                descripcionDetalle = 'Compra de productos';
            }
        } else {
            if (detalle.descripcion) {
                descripcionDetalle = detalle.descripcion;
            } else if (detalle.servicios && detalle.servicios.length > 0) {
                const serviciosStr = detalle.servicios.map(item => 
                    `${item.servicio?.nombre || 'Servicio'}`
                ).join(', ');
                descripcionDetalle = serviciosStr;
            } else {
                descripcionDetalle = 'Servicio';
            }
        }
        
        // Generar la tabla de productos/servicios
        let productoTabla = '';
        if (esCompra) {
            // Lógica para generar tabla de productos...
            productoTabla = await generarTablaProductos(detalle);
        } else {
            // Lógica para generar tabla de servicios...
            if (detalle.servicios && detalle.servicios.length > 0) {
                productoTabla = `<table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Descripción</th>
                            <th class="text-center">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detalle.servicios.map(item => `
                            <tr>
                                <td>${item.servicio?.nombre || 'Servicio sin nombre'}</td>
                                <td>${item.descripcion || 'Instalacion de Equipos 5514'}</td>
                                <td class="text-center">${item.cantidad || 1}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="text-end"><strong>Total:</strong></td>
                            <td class="text-end"><strong>$${totalFormateado}</strong></td>
                        </tr>
                    </tfoot>
                </table>`;
            } else {
                productoTabla = `<div class="bg-light p-3" style="border-radius: 5px;">
                    <div class="row">
                        <div class="col">
                            <p class="mb-1"><i class="fas fa-info-circle me-2 text-info"></i><strong>Descripción:</strong> ${descripcionDetalle}</p>
                            <p class="mb-0"><i class="fas fa-dollar-sign me-2 text-success"></i><strong>Total:</strong> ${totalFormateado}</p>
                        </div>
                    </div>
                </div>`;
            }
        }
        
        // Generar HTML según el diseño mostrado en la imagen
        const detalleHTML = `
            <div class="bg-success p-3 d-flex justify-content-between align-items-center" style="border-radius: 8px 8px 0 0;">
                <div>
                    <h5 class="mb-0 text-white font-weight-bold">Orden #${detalle.id}</h5>
                </div>
                <button type="button" class="btn-close btn-close-white" id="cerrarDetalleOrden"></button>
            </div>
            
            <div class="p-3 d-flex">
                <div class="me-3">
                    <span class="badge ${getEstadoBadgeClass(detalle.estado)}">${detalle.estado}</span>
                            </div>
                <div>
                    <span class="badge ${esCompra ? 'bg-info' : 'bg-secondary'}">${esCompra ? 'COMPRA' : 'SERVICIO'}</span>
                            </div>
                            </div>
            
            <div class="p-3">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <p class="mb-2"><i class="fas fa-user me-2 text-secondary"></i><strong>Cliente:</strong> ${detalle.cliente?.usuario?.nombre || 'Cliente'}</p>
                        <p class="mb-2"><i class="fas fa-envelope me-2 text-secondary"></i><strong>Email:</strong> ${detalle.cliente?.usuario?.email || 'cliente@example.com'}</p>
                        <p class="mb-2"><i class="fas fa-map-marker-alt me-2 text-secondary"></i><strong>Dirección:</strong> ${detalle.cliente?.direccion || 'delegacion guane'}</p>
                        <p class="mb-0"><i class="fas fa-phone me-2 text-secondary"></i><strong>Teléfono:</strong> ${detalle.cliente?.telefono || '762882'}</p>
                        </div>
                    <div class="col-md-6">
                        <p class="mb-2"><i class="fas fa-calendar-plus me-2 text-secondary"></i><strong>Fecha Creación:</strong> ${detalle.createdAt ? new Date(detalle.createdAt).toLocaleDateString() : (detalle.fecha ? new Date(detalle.fecha).toLocaleDateString() : 'Sin fecha')}</p>
                        <p class="mb-0"><i class="fas fa-calendar-check me-2 text-secondary"></i><strong>Fecha Programada:</strong> ${detalle.fechaProgramada ? new Date(detalle.fechaProgramada).toLocaleDateString() : 'No programada'}</p>
                    </div>
                </div>
                
                <hr>
                
                <div class="mb-3">
                    <h6 class="mb-3">${esCompra ? 'Detalle de Productos:' : 'Detalle de Servicios:'}</h6>
                    ${productoTabla}
                            </div>
                        </div>
            
            <div class="border-top p-3 d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="mb-0 text-success">Total: ${totalFormateado}</h5>
                </div>
                <div>
                    ${detalle.estado === 'COMPLETADA' ? `
                    <button type="button" class="btn btn-success me-2" id="btnGenerarFactura">
                        <i class="fas fa-file-invoice-dollar me-1"></i> Generar Factura
                    </button>` : ''}
                    <button type="button" class="btn btn-secondary" id="btnCerrarDetalleOrden">
                        <i class="fas fa-times me-1"></i> Cerrar
                    </button>
                    </div>
                </div>
            `;
            
        // Actualizar el contenedor con el detalle de la orden
        detalleContainer.innerHTML = detalleHTML;
        
        // Agregar eventos a los botones de cerrar
        const btnCerrarDetalleOrden = document.getElementById('btnCerrarDetalleOrden');
        const btnCerrarX = document.getElementById('cerrarDetalleOrden');
        
        if (btnCerrarDetalleOrden) {
            btnCerrarDetalleOrden.addEventListener('click', cerrarDetalleOrden);
        }
        
        if (btnCerrarX) {
            btnCerrarX.addEventListener('click', cerrarDetalleOrden);
        }
        
        // Agregar evento al botón de generar factura si existe
        const btnGenerarFactura = document.getElementById('btnGenerarFactura');
        if (btnGenerarFactura) {
            btnGenerarFactura.addEventListener('click', () => {
                cerrarDetalleOrden();
                if (typeof generarFactura === 'function') {
                    generarFactura(detalle.id);
                } else {
                    console.error('La función generarFactura no está definida');
                    mostrarAlerta('No se pudo generar la factura. Función no disponible.', 'warning');
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar detalle de la orden:', error);
        detalleContainer.innerHTML = `
            <div class="p-3">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error al cargar el detalle de la orden: ${error.message}
                </div>
            </div>
            <div class="border-top p-3 text-end">
                <button type="button" class="btn btn-secondary" id="btnCerrarDetalleOrden">
                    Cerrar
                                    </button>
                                </div>
                            `;
                            
        // Agregar evento al botón de cerrar en caso de error
        const btnCerrarError = document.getElementById('btnCerrarDetalleOrden');
        if (btnCerrarError) {
            btnCerrarError.addEventListener('click', cerrarDetalleOrden);
        }
    }
}

// Función para cerrar el detalle de orden
function cerrarDetalleOrden() {
    console.log('Cerrando detalle de orden');
    const detalleContainer = document.getElementById('detalleOrdenContainer');
    const overlay = document.getElementById('detalleOrdenOverlay');
    
    if (detalleContainer) {
        detalleContainer.style.display = 'none';
    }
    
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    document.body.style.overflow = ''; // Restaurar scroll
}

// Cache para almacenar nombres de productos
const productosCache = {};

// Función para obtener el nombre de un producto por su ID
async function obtenerNombreProducto(productoId) {
    // Si ya tenemos el producto en cache, devolverlo
    if (productosCache[productoId]) {
        return productosCache[productoId];
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/productos/${productoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.warn(`No se pudo obtener el producto con ID ${productoId}`);
            return null;
        }
        
        const producto = await response.json();
        
        if (producto && producto.nombre) {
            // Guardar en cache para futuras consultas
            productosCache[productoId] = producto.nombre;
            return producto.nombre;
        }
        
        return null;
    } catch (error) {
        console.error(`Error al obtener el producto ${productoId}:`, error);
        return null;
    }
}

// Función para generar la tabla de productos de una orden
async function generarTablaProductos(detalle) {
    const total = detalle.total || detalle.precios?.total || 0;
    
    // Si tiene detalles estructurados, usarlos
    if (detalle.detalles && detalle.detalles.length > 0) {
        return `<table class="table table-striped" id="tablaProductos">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-end">Precio Unitario</th>
                    <th class="text-end">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${detalle.detalles.map(item => {
                    const precioUnitario = item.precioUnitario || item.precio || 0;
                    const subtotal = precioUnitario * (item.cantidad || 1);
                    return `
                        <tr data-producto-id="${item.productoId || ''}">
                            <td>${item.producto?.nombre || item.productoNombre || 'Cargando...'}</td>
                            <td>${item.descripcion || ''}</td>
                            <td class="text-center">${item.cantidad || 1}</td>
                            <td class="text-end">$${precioUnitario.toFixed(2)}</td>
                            <td class="text-end">$${subtotal.toFixed(2)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4" class="text-end"><strong>Total:</strong></td>
                    <td class="text-end"><strong>$${total.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>`;
    }
    
    // Si no tiene detalles estructurados, extraer productos de la descripción
    if (detalle.descripcion) {
        // Extraer productos de la descripción
        const productos = await extraerProductosDeLaDescripcion(detalle.descripcion, total);
        
        if (productos.length > 0) {
            // Crear filas de la tabla
            const filas = productos.map(prod => {
                const subtotal = prod.precio * prod.cantidad;
                return `
                    <tr>
                        <td><strong>${prod.nombre}</strong></td>
                        <td class="text-center">${prod.cantidad}</td>
                        <td class="text-end">$${prod.precio.toFixed(2)}</td>
                        <td class="text-end">$${subtotal.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
            
            // Calcular el total basado en los productos
            let totalCalculado = productos.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0);
            // Si hay un total especificado en la orden, usarlo en lugar del calculado
            if (total && total > 0) {
                totalCalculado = total;
            }
            
            return `<table class="table table-striped">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-end">Precio</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-end"><strong>Total:</strong></td>
                        <td class="text-end"><strong>$${totalCalculado.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>`;
        }
    }
    
    // Si no hay información de productos, devolver tabla vacía
    return `<div class="alert alert-info">No hay información de productos disponible</div>`;
}

// Función para extraer productos de la descripción de una orden
async function extraerProductosDeLaDescripcion(descripcion, total) {
    const productos = [];
    
    if (!descripcion) return productos;
    
    // Intentar extraer con formato "Nx Producto"
    const productosRegex = /(\d+)x\s+([^,\n:]+)/g;
    let match;
    const productosPromesas = [];
    
    while ((match = productosRegex.exec(descripcion)) !== null) {
        const nombreProducto = match[2].trim();
        const cantidad = parseInt(match[1]);
        
        // Guardar promesa para resolver después
        productosPromesas.push(
            obtenerPrecioPorNombre(nombreProducto).then(precio => ({
                nombre: nombreProducto,
                cantidad: cantidad,
                precio: precio
            }))
        );
    }
    
    // Si no hay productos identificados, crear un producto genérico
    if (productosPromesas.length === 0) {
        productos.push({
            nombre: 'Producto',
            cantidad: 1,
            precio: total || 50.00
        });
    } else {
        // Esperar a que se resuelvan todas las promesas
        const productosResueltos = await Promise.all(productosPromesas);
        productos.push(...productosResueltos);
    }
    
    return productos;
}

// Función para obtener un precio estimado basado en el nombre del producto
async function obtenerPrecioPorNombre(nombreProducto) {
    console.log(`Buscando precio para producto: "${nombreProducto}"`);
    
    try {
        const token = localStorage.getItem('token');
        
        // Buscar productos en la base de datos que coincidan con el nombre
        const response = await fetch(`/api/tienda/productos/buscar?nombre=${encodeURIComponent(nombreProducto)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const productos = await response.json();
            
            // Si encontramos productos coincidentes, usar el precio del primero
            if (productos && productos.length > 0) {
                console.log(`Productos encontrados para "${nombreProducto}":`, productos);
                return productos[0].precio;
            }
        }
        
        // Si no se encuentra, devolver precio predeterminado
        console.log(`No se encontró precio para "${nombreProducto}", usando predeterminado`);
        return 50.00;
    } catch (error) {
        console.error(`Error al buscar precio para "${nombreProducto}":`, error);
        return 50.00;
    }
}

// Función para confirmar cancelación de una orden
function confirmarCancelarOrden(ordenId) {
    if (!ordenId) return;
    
    if (confirm(`¿Estás seguro de que quieres cancelar la orden #${ordenId}? Esta acción no se puede deshacer.`)) {
        console.log(`Confirmada la cancelación de la orden #${ordenId}`);
        cancelarOrden(ordenId);
    }
}

// Función para cancelar una orden
async function cancelarOrden(ordenId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/ordenes/${ordenId}/cancelar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
            if (!response.ok) {
            throw new Error(`Error al cancelar la orden: ${response.status}`);
            }
        
            mostrarAlerta('Orden cancelada con éxito', 'success');
        await mostrarListaOrdenes(); // Recargar la lista
    } catch (error) {
            console.error('Error al cancelar la orden:', error);
        mostrarAlerta(`Error al cancelar la orden: ${error.message}`, 'danger');
    }
}

// Función para confirmar eliminación de una orden
function confirmarEliminarOrden(ordenId) {
    if (!ordenId) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar la orden #${ordenId}? Esta acción no se puede deshacer y eliminará todos los datos asociados.`)) {
        console.log(`Confirmada la eliminación de la orden #${ordenId}`);
        eliminarOrden(ordenId);
    }
}

// Función para eliminar una orden
async function eliminarOrden(ordenId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/ordenes/${ordenId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

            if (!response.ok) {
            throw new Error(`Error al eliminar la orden: ${response.status}`);
            }
        
            mostrarAlerta('Orden eliminada con éxito', 'success');
        await mostrarListaOrdenes(); // Recargar la lista
    } catch (error) {
            console.error('Error al eliminar la orden:', error);
        mostrarAlerta(`Error al eliminar la orden: ${error.message}`, 'danger');
    }
}

// Función para obtener el precio y detalles de un producto
async function obtenerDetallesProducto(productoId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tienda/productos/${productoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.warn(`No se pudo obtener el producto con ID ${productoId}`);
            return null;
        }
        
        const producto = await response.json();
        return producto;
    } catch (error) {
        console.error(`Error al obtener el producto ${productoId}:`, error);
        return null;
    }
}

// Función para calcular el total de una orden basado en sus productos
async function calcularTotalOrden(productos) {
    let total = 0;
    
    for (const producto of productos) {
        const detallesProducto = await obtenerDetallesProducto(producto.id);
        if (detallesProducto && detallesProducto.precio) {
            total += detallesProducto.precio * (producto.cantidad || 1);
        }
    }
    
    return total;
} 

// Estado global para órdenes
const ordenesState = {
    serviciosSeleccionados: [],
    total: 0
};

// Función para crear una nueva orden
function nuevaOrden() {
    console.log('Iniciando nueva orden...');
    ordenesState.serviciosSeleccionados = [];
    ordenesState.total = 0;
    
    const formContainer = document.getElementById('nuevaOrdenForm');
    const listaOrdenes = document.getElementById('listaOrdenes');
    
    if (formContainer && listaOrdenes) {
        formContainer.style.display = 'block';
        listaOrdenes.style.display = 'none';
        
        // Mantener el título original, eliminar el botón superior si existe
        const tituloElement = formContainer.querySelector('h3');
        // Si el título ha sido reemplazado por nuestro contenedor flex, restaurarlo
        if (!tituloElement && formContainer.querySelector('.d-flex h3')) {
            const headerContainer = formContainer.querySelector('.d-flex');
            const nuevoTitulo = document.createElement('h3');
            nuevoTitulo.textContent = 'Nueva Orden';
            headerContainer.parentNode.replaceChild(nuevoTitulo, headerContainer);
        }
        
        // Añadir botón de cancelación al panel de resumen
        const resumenOrden = document.getElementById('resumenOrden');
        if (resumenOrden) {
            // Mostrar el resumen siempre, aunque esté vacío inicialmente
            resumenOrden.style.display = 'block';
            
            // Buscar el contenedor de botones
            const botonesContainer = resumenOrden.querySelector('.text-end');
            if (botonesContainer) {
                // Verificar si ya existe un botón de submit
                const btnCrear = botonesContainer.querySelector('button[type="submit"]');
                if (btnCrear) {
                    // Eliminar botón anterior si existe
                    const btnCancelarExistente = document.getElementById('btnCancelarOrden');
                    if (btnCancelarExistente) {
                        btnCancelarExistente.remove();
                    }
                    
                    // Crear el botón de cancelar con el mismo estilo que el botón crear
                    const btnCancelar = document.createElement('button');
                    btnCancelar.id = 'btnCancelarOrden';
                    btnCancelar.type = 'button';
                    btnCancelar.className = 'btn btn-danger me-2';
                    btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar';
                    btnCancelar.onclick = cancelarNuevaOrden;
                    
                    // Insertar antes del botón crear
                    botonesContainer.insertBefore(btnCancelar, btnCrear);
                }
            }
        }
    }
    
    // Cargar servicios disponibles
    loadServicesForOrders();
}

// Función para cargar servicios disponibles para órdenes
async function loadServicesForOrders() {
    console.log('Iniciando carga de servicios para órdenes...');
    try {
        const token = localStorage.getItem('token');
        
        console.log('Realizando petición a /api/servicios...');
        const response = await fetch('/api/servicios', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Error en la respuesta:', error);
            throw new Error(`Error al cargar servicios: ${response.status} ${response.statusText}`);
        }

        const servicios = await response.json();
        console.log('Servicios obtenidos:', servicios);
        
        if (!Array.isArray(servicios)) {
            console.error('La respuesta no es un array:', servicios);
            throw new Error('Formato de respuesta inválido');
        }

        displayServicesForOrders(servicios);
        console.log('Servicios mostrados correctamente');
    } catch (error) {
        console.error('Error en loadServicesForOrders:', error);
        mostrarAlerta('Error al cargar servicios para órdenes: ' + error.message, 'danger');
    }
}

// Función para mostrar servicios en el formulario de órdenes
function displayServicesForOrders(servicios) {
    console.log('Iniciando displayServicesForOrders...');
    const container = document.getElementById('serviciosDisponibles');
    
    if (!container) {
        console.error('No se encontró el contenedor #serviciosDisponibles');
        mostrarAlerta('Error: No se encontró el contenedor de servicios', 'danger');
        return;
    }

    console.log('Limpiando contenedor...');
    container.innerHTML = '';

    if (!Array.isArray(servicios) || servicios.length === 0) {
        console.log('No hay servicios para mostrar');
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay servicios disponibles en este momento
                </div>
            </div>
        `;
        return;
    }

    // Crear las tarjetas de servicios
    const serviciosHTML = servicios.map(servicio => {
        const tipoServicio = servicio.tipo === 'POR_HORA' ? 'Por Hora' : 'Por Cantidad';
        const unidad = servicio.tipo === 'POR_HORA' ? '/hora' : '/unidad';

        return `
            <div class="col-md-6 mb-4 servicio-item" data-id="${servicio.id}" data-tipo="${servicio.tipo}">
                <div class="card h-100 shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="card-title mb-0 text-primary">${servicio.nombre}</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text text-dark">${servicio.descripcion || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <p class="mb-0 text-dark"><strong>Precio Base:</strong> <span class="text-success">$${(servicio.precioBase || 0).toFixed(2)}${unidad}</span></p>
                                <p class="mb-0 text-dark"><strong>Tipo:</strong> <span class="badge bg-info">${tipoServicio}</span></p>
                            </div>
                            <div class="d-flex flex-column">
                                <input type="number" class="form-control mb-2" 
                                       id="cantidad-${servicio.id}" 
                                       min="1" value="1" 
                                       style="width: 80px; background-color: #ffffff; color: #212529;">
                                <button type="button" class="btn btn-primary" 
                                        onclick="seleccionarServicio(${servicio.id}, '${servicio.nombre}', ${servicio.precioBase}, '${servicio.tipo}')">
                                    <i class="fas fa-plus-circle"></i> Seleccionar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Crear contenedor para los servicios
    container.innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <input type="text" id="buscarServicio" class="form-control" placeholder="Buscar servicio..." 
                       style="background-color: #ffffff; color: #212529;">
            </div>
            <div id="listaServiciosDisponibles" class="row w-100">
                ${serviciosHTML}
            </div>
        </div>
    `;
    
    // Implementar búsqueda simple
    const buscarServicioInput = document.getElementById('buscarServicio');
    if (buscarServicioInput) {
        buscarServicioInput.addEventListener('input', function() {
            const busqueda = this.value.toLowerCase().trim();
            const serviciosItems = document.querySelectorAll('.servicio-item');
            
            serviciosItems.forEach(item => {
                const nombre = item.querySelector('.card-title').textContent.toLowerCase();
                const descripcion = item.querySelector('.card-text').textContent.toLowerCase();
                
                if (nombre.includes(busqueda) || descripcion.includes(busqueda)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// Función para seleccionar un servicio
function seleccionarServicio(servicioId, nombre, precioBase, tipo = 'POR_HORA') {
    console.log('Seleccionando servicio:', servicioId);
    
    const cantidadInput = document.getElementById(`cantidad-${servicioId}`);
    if (!cantidadInput) {
        console.error('No se encontró el input de cantidad para el servicio:', servicioId);
        mostrarAlerta('Error al seleccionar el servicio', 'danger');
        return;
    }

    const cantidad = parseInt(cantidadInput.value);
    if (isNaN(cantidad) || cantidad < 1) {
        mostrarAlerta('Por favor ingrese una cantidad válida', 'warning');
        return;
    }

    // Agregar servicio al estado
    const servicio = {
        id: servicioId,
        nombre: nombre,
        cantidad: cantidad,
        precioBase: precioBase,
        tipo: tipo,
        total: cantidad * precioBase
    };

    // Verificar si el servicio ya está seleccionado
    const index = ordenesState.serviciosSeleccionados.findIndex(s => s.id === servicioId);
    if (index >= 0) {
        ordenesState.serviciosSeleccionados[index] = servicio;
    } else {
        ordenesState.serviciosSeleccionados.push(servicio);
    }

    actualizarResumenOrden();
    mostrarAlerta(`Servicio agregado: ${nombre} x ${cantidad}`, 'success');
}

// Función para actualizar el resumen de la orden
function actualizarResumenOrden() {
    const resumenOrden = document.getElementById('resumenOrden');
    const serviciosSeleccionados = document.getElementById('serviciosSeleccionados');
    const totalOrden = document.getElementById('totalOrden');
    
    if (!resumenOrden || !serviciosSeleccionados || !totalOrden) {
        console.error('No se encontraron los elementos necesarios para actualizar el resumen');
        return;
    }
    
    // El resumen siempre debe estar visible una vez que se inicie una nueva orden
    resumenOrden.style.display = 'block';
    
    // Generar HTML para servicios seleccionados
    if (ordenesState.serviciosSeleccionados.length > 0) {
        const serviciosHTML = ordenesState.serviciosSeleccionados.map(servicio => {
            const tipoServicio = servicio.tipo === 'POR_HORA' ? 'hora(s)' : 'unidad(es)';
            return `
                <div class="card mb-2">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0">${servicio.nombre}</h5>
                                <p class="mb-0 text-muted">${servicio.cantidad} ${tipoServicio} x $${servicio.precioBase.toFixed(2)}</p>
                            </div>
                            <div>
                                <span class="fs-5">$${servicio.total.toFixed(2)}</span>
                                <button type="button" class="btn btn-sm btn-outline-danger ms-2" 
                                        onclick="eliminarServicio(${servicio.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        serviciosSeleccionados.innerHTML = serviciosHTML;
        
        // Calcular y mostrar el total
        ordenesState.total = ordenesState.serviciosSeleccionados.reduce((sum, servicio) => sum + servicio.total, 0);
        totalOrden.textContent = ordenesState.total.toFixed(2);
    } else {
        // Mostrar mensaje si no hay servicios seleccionados
        serviciosSeleccionados.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                No hay servicios seleccionados. Por favor, seleccione al menos un servicio.
            </div>
        `;
        totalOrden.textContent = '0.00';
    }
    
    // Asegurarse de que el botón de cancelar siempre esté presente
    const botonesContainer = resumenOrden.querySelector('.text-end');
    if (botonesContainer) {
        // Verificar si el botón ya existe
        if (!document.getElementById('btnCancelarOrden')) {
            const btnCrear = botonesContainer.querySelector('button[type="submit"]');
            if (btnCrear) {
                const btnCancelar = document.createElement('button');
                btnCancelar.id = 'btnCancelarOrden';
                btnCancelar.type = 'button';
                btnCancelar.className = 'btn btn-danger me-2';
                btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar';
                btnCancelar.onclick = cancelarNuevaOrden;
                
                botonesContainer.insertBefore(btnCancelar, btnCrear);
            }
        }
    }
}

// Función para eliminar un servicio del resumen
function eliminarServicio(servicioId) {
    console.log('Eliminando servicio:', servicioId);
    
    // Encontrar el servicio en el array
    const index = ordenesState.serviciosSeleccionados.findIndex(s => s.id === servicioId);
    if (index >= 0) {
        const servicio = ordenesState.serviciosSeleccionados[index];
        ordenesState.serviciosSeleccionados.splice(index, 1);
        actualizarResumenOrden();
        mostrarAlerta(`Servicio eliminado: ${servicio.nombre}`, 'success');
    }
}

// Función para cancelar la creación de una nueva orden
function cancelarNuevaOrden() {
    console.log('Cancelando creación de orden...');
    
    // Limpiar estado
    ordenesState.serviciosSeleccionados = [];
    ordenesState.total = 0;
    
    // Volver a la lista de órdenes
    const formContainer = document.getElementById('nuevaOrdenForm');
    const listaOrdenes = document.getElementById('listaOrdenes');
    
    if (formContainer && listaOrdenes) {
        formContainer.style.display = 'none';
        listaOrdenes.style.display = 'block';
    }
    
    mostrarAlerta('Creación de orden cancelada', 'info');
}

// Exponemos las funciones al ámbito global
window.nuevaOrden = nuevaOrden;
window.seleccionarServicio = seleccionarServicio;
window.eliminarServicio = eliminarServicio;
window.cancelarNuevaOrden = cancelarNuevaOrden;

// Añadir manejador de evento para el envío del formulario de órdenes
document.addEventListener('DOMContentLoaded', function() {
    const ordenesForm = document.getElementById('ordenesForm');
    if (ordenesForm) {
        ordenesForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (ordenesState.serviciosSeleccionados.length === 0) {
                mostrarAlerta('Debe seleccionar al menos un servicio', 'warning');
                return;
            }

            const fechaProgramada = document.getElementById('fechaProgramada').value;
            const descripcion = document.getElementById('descripcion').value;

            if (!fechaProgramada) {
                mostrarAlerta('Debe seleccionar una fecha programada', 'warning');
                return;
            }

            try {
                // Obtener el usuario actual
                const usuario = JSON.parse(localStorage.getItem('usuario'));
                if (!usuario) {
                    mostrarAlerta('No se encontró información del usuario. Por favor, inicie sesión nuevamente.', 'danger');
                    return;
                }
                
                // Obtener el cliente asociado al usuario
                const clienteResponse = await fetch(`/api/usuarios/${usuario.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!clienteResponse.ok) {
                    throw new Error('Error al obtener información del cliente');
                }

                const clienteData = await clienteResponse.json();
                
                if (!clienteData.cliente) {
                    throw new Error('No se encontró un cliente asociado a este usuario');
                }

                console.log('Preparando datos para crear orden:', {
                    clienteId: clienteData.cliente.id,
                    servicios: ordenesState.serviciosSeleccionados.map(s => ({
                        servicioId: s.id,
                        cantidad: s.cantidad
                    })),
                    fechaProgramada,
                    descripcion
                });

                const response = await fetch('/api/ordenes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        clienteId: clienteData.cliente.id,
                        servicios: ordenesState.serviciosSeleccionados.map(s => ({
                            servicioId: s.id,
                            cantidad: s.cantidad
                        })),
                        fechaProgramada,
                        descripcion
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error del servidor:', errorData);
                    throw new Error(errorData.message || `Error al crear la orden: ${response.status}`);
                }

                const orden = await response.json();
                console.log('Orden creada exitosamente:', orden);
                
                // Generar factura automáticamente
                try {
                    console.log('Iniciando generación de factura para orden:', orden.id);
                    const facturaResponse = await fetch(`/api/facturas/orden/${orden.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    if (!facturaResponse.ok) {
                        const errorData = await facturaResponse.json();
                        console.error('Error al generar factura:', errorData);
                        throw new Error(errorData.message || `Error al generar factura: ${facturaResponse.status}`);
                    }

                    const factura = await facturaResponse.json();
                    console.log('Factura generada exitosamente:', factura);
                    mostrarAlerta('Orden creada y factura generada exitosamente. Consulte la sección de Facturas.', 'success');
                } catch (facturaError) {
                    console.error('Error al generar factura:', facturaError);
                    mostrarAlerta('Orden creada exitosamente. Sin embargo, hubo un problema al generar la factura.', 'warning');
                }
                
                // Limpiar el formulario y mostrar la lista de órdenes
                ordenesState.serviciosSeleccionados = [];
                document.getElementById('nuevaOrdenForm').style.display = 'none';
                document.getElementById('listaOrdenes').style.display = 'block';
                await mostrarListaOrdenes();
            } catch (error) {
                console.error('Error detallado al crear orden:', error);
                mostrarAlerta(`Error al crear la orden: ${error.message}`, 'danger');
            }
        });
    }
}); 