// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando sección de órdenes...');
    try {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Usuario no autenticado');
            window.location.href = '/login.html';
            return;
        }
        
        // Inicializar elementos UI
        inicializarUI();
        
        // Cargar las órdenes
        await mostrarListaOrdenes();
        
        console.log('Sección de órdenes inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la sección de órdenes:', error);
        mostrarAlerta('Error al cargar las órdenes. Intente nuevamente más tarde.', 'danger');
    }
});

// Inicializar elementos de la interfaz de usuario
function inicializarUI() {
    // Inicializar filtros si existen
    const btnLimpiarFiltros = document.getElementById('limpiarFiltros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }
    
    const btnAplicarFiltros = document.getElementById('aplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }
    
    // Inicializar botones de navegación
    const btnNuevaOrden = document.getElementById('btnNuevaOrden');
    if (btnNuevaOrden) {
        btnNuevaOrden.addEventListener('click', mostrarFormularioOrden);
    }
}

// Función para aplicar filtros
function aplicarFiltros() {
    const estado = document.getElementById('filtroEstado')?.value;
    const tipo = document.getElementById('filtroTipo')?.value;
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value;
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo = tipo;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;
    
    mostrarListaOrdenes(filtros);
}

// Función para limpiar filtros
function limpiarFiltros() {
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroFechaDesde = document.getElementById('filtroFechaDesde');
    const filtroFechaHasta = document.getElementById('filtroFechaHasta');
    
    if (filtroEstado) filtroEstado.value = '';
    if (filtroTipo) filtroTipo.value = '';
    if (filtroFechaDesde) filtroFechaDesde.value = '';
    if (filtroFechaHasta) filtroFechaHasta.value = '';
    
    mostrarListaOrdenes();
}

const ordenesManager = {
    async crearOrden(datos) {
        try {
            const response = await fetch('/api/ordenes', {
                method: 'POST',
                headers: auth.getHeaders(),
                body: JSON.stringify(datos)
            });
            return await response.json();
        } catch (error) {
            console.error('Error al crear orden:', error);
            throw error;
        }
    },

    async listarOrdenes(filtros = {}) {
        try {
            const queryParams = new URLSearchParams(filtros);
            const response = await fetch(`/api/ordenes?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error al listar órdenes:', error);
            throw error;
        }
    },

    async actualizarEstado(ordenId, estado) {
        try {
            console.log('Actualizando estado:', { ordenId, estado });
            
            // Validar el estado antes de enviarlo
            const estadosValidos = ['PENDIENTE', 'PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
            const estadoUpper = estado.toUpperCase();
            
            if (!estadosValidos.includes(estadoUpper)) {
                throw new Error(`Estado inválido: ${estado}. Estados válidos: ${estadosValidos.join(', ')}`);
            }

            const response = await fetch(`/api/ordenes/${ordenId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ estado: estadoUpper })
            });
            
            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            
            if (!response.ok) {
                if (data.estadosPermitidos) {
                    throw new Error(`Estado inválido. Estados permitidos: ${data.estadosPermitidos.join(', ')}`);
                }
                throw new Error(data.message || data.error || `Error al actualizar estado: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            throw error;
        }
    },
    
    async cancelarOrden(ordenId) {
        try {
            const response = await fetch(`/api/ordenes/${ordenId}/cancelar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Error al cancelar la orden: ${response.status}`);
            }

            const orden = await response.json();
            console.log('Orden cancelada:', orden);
            
            mostrarAlerta('Orden cancelada con éxito', 'success');
            
            // Recargar la lista de órdenes
            await mostrarListaOrdenes();
        } catch (error) {
            console.error('Error al cancelar la orden:', error);
            mostrarAlerta(`Error: ${error.message}`, 'danger');
        }
    }
};

// Variables globales para el estado de órdenes
const ordenesState = {
    serviciosSeleccionados: [],
    total: 0
};

// Funciones para la UI de órdenes
function mostrarFormularioOrden() {
    const serviciosSeleccionados = [];
    let total = 0;

    async function cargarServicios() {
        try {
            const response = await fetch('/api/servicios');
            const servicios = await response.json();
            const serviciosContainer = document.getElementById('serviciosDisponibles');
            
            serviciosContainer.innerHTML = servicios.map(servicio => `
                <div class="card mb-3">
                        <div class="card-body">
                        <h5 class="card-title">${servicio.nombre}</h5>
                        <p class="card-text">${servicio.descripcion}</p>
                        <p class="card-text">Precio: $${servicio.precioBase}</p>
                        <div class="form-group">
                            <label>Cantidad:</label>
                            <input type="number" min="1" value="1" class="form-control cantidad-servicio" 
                                   data-servicio-id="${servicio.id}" data-precio="${servicio.precioBase}">
                        </div>
                        <button class="btn btn-primary agregar-servicio" data-servicio-id="${servicio.id}">
                            Agregar
                        </button>
                    </div>
                </div>
            `).join('');

            // Eventos para agregar servicios
            document.querySelectorAll('.agregar-servicio').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const servicioId = e.target.dataset.servicioId;
                    const cantidad = document.querySelector(`input[data-servicio-id="${servicioId}"]`).value;
                    const servicio = servicios.find(s => s.id === parseInt(servicioId));
                    
                    serviciosSeleccionados.push({
                        servicioId: parseInt(servicioId),
                        cantidad: parseInt(cantidad),
                        nombre: servicio.nombre,
                        precio: servicio.precioBase
                    });

                    actualizarResumen();
                });
            });
        } catch (error) {
            console.error('Error al cargar servicios:', error);
        }
    }

    function actualizarResumen() {
        const resumenContainer = document.getElementById('resumenOrden');
        total = serviciosSeleccionados.reduce((sum, s) => sum + (s.precio * s.cantidad), 0);

        resumenContainer.innerHTML = `
            <h4>Resumen de la Orden</h4>
            <ul class="list-group">
                ${serviciosSeleccionados.map(s => `
                    <li class="list-group-item">
                        ${s.nombre} x ${s.cantidad} = $${s.precio * s.cantidad}
                        <button class="btn btn-sm btn-danger float-end eliminar-servicio" 
                                data-servicio-id="${s.servicioId}">Eliminar</button>
                    </li>
                `).join('')}
            </ul>
            <div class="mt-3">
                <h5>Total: $${total}</h5>
                </div>
            `;

        // Eventos para eliminar servicios
        document.querySelectorAll('.eliminar-servicio').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const servicioId = parseInt(e.target.dataset.servicioId);
                const index = serviciosSeleccionados.findIndex(s => s.servicioId === servicioId);
                if (index > -1) {
                    serviciosSeleccionados.splice(index, 1);
                    actualizarResumen();
                }
            });
        });
    }

    // Cargar servicios al mostrar el formulario
    cargarServicios();
}

// Función para mostrar detalle de una orden específica
async function mostrarDetalleOrden(ordenId) {
    try {
        // Validar que el ID sea un número válido
        ordenId = parseInt(ordenId, 10);
        
        if (isNaN(ordenId) || ordenId <= 0) {
            console.error('ID de orden inválido:', ordenId);
            mostrarAlerta('Error: ID de orden inválido', 'danger');
            return;
        }
        
        const modal = document.getElementById('detalleOrdenModal');
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }

        // Crear la estructura del modal si no existe
        if (!modal.querySelector('.modal-dialog')) {
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles de la Orden</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="detalleOrdenContenido">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-danger" id="btnCancelarOrdenModal" style="display: none;">
                                Cancelar Orden
                            </button>
                            <button type="button" class="btn btn-success" id="btnGenerarFactura" style="display: none;">
                                Generar Prefactura
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Mostrar el modal
        const modalBootstrap = new bootstrap.Modal(modal);
        modalBootstrap.show();

        // Obtener los detalles de la orden
        let response;
        try {
            response = await fetch(`/api/ordenes/${ordenId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        } catch (error) {
            console.error('Error en la petición de red:', error);
            throw new Error(`Error al conectar con el servidor: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error del servidor (${response.status}):`, errorText);
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        let orden;
        try {
            orden = await response.json();
            console.log('Datos de la orden recibidos:', orden);
        } catch (error) {
            console.error('Error al procesar la respuesta JSON:', error);
            throw new Error(`Error al procesar la respuesta: ${error.message}`);
        }

        const contenido = document.getElementById('detalleOrdenContenido');
        if (!contenido) {
            console.error('Contenedor de detalles no encontrado');
            return;
        }

        // Formatear fechas
        const fechaCreacion = orden.fechaCreacion ? 
            new Date(orden.fechaCreacion).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : 
            (orden.fecha ? new Date(orden.fecha).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'No especificada');

        const fechaProgramada = orden.fechaProgramada ? 
            new Date(orden.fechaProgramada).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : (
                orden.fecha ? 
            new Date(orden.fecha).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
                }) : 'No programada'
            );

        // Obtener el usuario actual para verificar si es admin
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const esAdmin = usuario && usuario.tipo === 'ADMIN';

        // Determinar si es una orden de servicio o una compra
        const esCompra = orden.tipo === 'COMPRA';
        
        // Construir el HTML de los items (servicios o productos)
        let itemsHtml = '';
        let total = 0;
        let productosEncontrados = [];

        // PROCESAMIENTO DE ÓRDENES DE COMPRA
        if (esCompra) {
            console.log("Procesando orden de compra:", orden);
            
            // Caso 1: La orden tiene detalles estructurados
            if (orden.detalles && orden.detalles.length > 0) {
                console.log("Procesando detalles estructurados:", orden.detalles);
                
                itemsHtml = orden.detalles.map(detalle => {
                    const precioUnitario = detalle.precioUnitario || 0;
                    const cantidad = detalle.cantidad || 1;
                    const subtotal = precioUnitario * cantidad;
            return `
                        <tr class="producto-row">
                            <td><strong>${detalle.producto?.nombre || detalle.productoNombre || 'Producto no especificado'}</strong></td>
                            <td class="text-center">${cantidad}</td>
                            <td class="text-end">$${precioUnitario.toFixed(2)}</td>
                            <td class="text-end">$${subtotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        // Calcular el total
                total = orden.total || orden.detalles.reduce((sum, detalle) => {
                    const precioUnitario = detalle.precioUnitario || 0;
                    const cantidad = detalle.cantidad || 1;
                    return sum + (precioUnitario * cantidad);
        }, 0);
            }
            // Caso 2: La orden tiene datos pero no en detalles estructurados
            else if (orden.descripcion) {
                console.log("Extrayendo productos de la descripción:", orden.descripcion);
                
                // Intentar extraer información de productos de la descripción
                try {
                    // Buscar patrones como "1x Teclado RGB" en la descripción
                    const productosRegex = /(\d+)x\s+([^,\n:]+)/g;
                    let match;
                    productosEncontrados = [];
                    
                    while ((match = productosRegex.exec(orden.descripcion)) !== null) {
                        productosEncontrados.push({
                            cantidad: parseInt(match[1]),
                            nombre: match[2].trim() // Aquí capturamos el nombre real del producto
                        });
                    }
                    
                    // Si no se encontraron productos con el patrón principal, intentar otras formas
                    if (productosEncontrados.length === 0) {
                        // Intentar extraer de "Compra de productos: X"
                        const compraMatch = orden.descripcion.match(/[Cc]ompra de productos?:?\s*(.+)/i);
                        if (compraMatch && compraMatch[1]) {
                            // Dividir por comas para múltiples productos
                            const productoLista = compraMatch[1].split(/[,;]+/).map(item => item.trim());
                            productoLista.forEach(prod => {
                                if (prod) {
                                    productosEncontrados.push({
                                        cantidad: 1,
                                        nombre: prod
                                    });
                    }
                });
            }
        }

                    console.log("Productos encontrados después de extracción:", productosEncontrados);
                    
                    if (productosEncontrados.length > 0) {
                        // Extraer el precio total si está disponible
                        const precioTotal = orden.total || 0;
                        
                        // Calcular precio si es posible
                        const cantidadTotal = productosEncontrados.reduce((sum, p) => sum + p.cantidad, 0);
                        let precioUnitario = cantidadTotal > 0 && precioTotal > 0 ? precioTotal / cantidadTotal : 0;
                        
                        // Si no hay precio, asignar un precio predeterminado para visualización
                        if (precioUnitario <= 0) {
                            precioUnitario = orden.total ? orden.total / productosEncontrados.length : 15.00;
                            console.log("Usando precio calculado para visualización:", precioUnitario);
                        }
                        
                        console.log("Generando HTML para productos encontrados:", productosEncontrados);
                        
                        // Generar HTML para los productos encontrados - NOMBRES REALES
                        itemsHtml = productosEncontrados.map(prod => {
                            const subtotal = precioUnitario * prod.cantidad;
                            return `
                                <tr class="producto-row">
                                    <td><strong>${prod.nombre}</strong></td>
                                    <td class="text-center">${prod.cantidad}</td>
                                    <td class="text-end">$${precioUnitario.toFixed(2)}</td>
                                    <td class="text-end">$${subtotal.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('');
                        
                        console.log("HTML generado para productos:", itemsHtml);
                        
                        // Usar el total de la orden
                        total = precioTotal;
                    } 
                    // Si no pudimos extraer productos específicos, mostrar la descripción directamente
                    else {
                        console.log("No se encontraron productos específicos, usando la descripción completa");
                        const descripcionLimpia = orden.descripcion.replace('Compra de productos:', '').trim();
                        detallesTexto = descripcionLimpia || 'Productos no especificados';
                    }
                } catch (error) {
                    console.error("Error al extraer productos de la descripción:", error);
                    detallesTexto = 'Error al procesar los productos';
                }
            } else {
                // Para servicios, mostrar servicios
                detallesTexto = orden.servicios?.map(s => s.servicio?.nombre || 'Servicio').join(', ') || 'Sin servicios';
            }

        return `
            <div class="card mb-3">
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
                                <strong>Fecha:</strong> ${(orden.fechaProgramada || orden.fecha) ? 
                                new Date(orden.fechaProgramada || orden.fecha).toLocaleDateString() : 
                                'Sin fecha registrada'}
                            </small>
                    </div>
                        <div class="col-md-6 text-md-end">
                            <h5 class="text-primary mb-0">$${orden.total || orden.precios?.total || 0.00.toFixed(2)}</h5>
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
        }).jo  in('');
        
        // Añadir eventos para ver detalles
        document.querySelectorAll('.ver-detalle-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el elemento que tiene el data-orden-id (podría ser el botón o algún elemento padre)
                const boton = e.target.closest('.ver-detalle-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    mostrarDetalleOrden(ordenId);
                } else {
                    console.error('No se pudo encontrar el ID de la orden');
                }
            });
        });
        
        // Añadir eventos para cancelar órdenes
        document.querySelectorAll('.cancelar-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el elemento que tiene el data-orden-id
                const boton = e.target.closest('.cancelar-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    confirmarCancelarOrden(ordenId);
                } else {
                    console.error('No se pudo encontrar el ID de la orden para cancelar');
                }
            });
        });

        // Añadir eventos para eliminar órdenes
        document.querySelectorAll('.eliminar-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el elemento que tiene el data-orden-id
                const boton = e.target.closest('.eliminar-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    confirmarEliminarOrden(ordenId);
                } else {
                    console.error('No se pudo encontrar el ID de la orden para eliminar');
                }
            });
        });
    } catch (error) {
        console.error('Error al mostrar órdenes:', error);
        const errorContainer = document.getElementById('listaOrdenes');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error al cargar las órdenes: ${error.message}
                </div>
            `;
        }
    }
}

// Función para obtener información adicional de productos
async function obtenerInformacionProductos(nombresProductos, ordenId) {
    try {
        console.log("La búsqueda de información de productos está deshabilitada o no disponible");
        
        // Si necesitas implementar esta funcionalidad en el futuro, 
        // verifica cuál es la ruta correcta para obtener productos en tu API
        
        // En caso de tener productos en otra parte de la aplicación, podrías intentar lo siguiente:
        /*
        const response = await fetch('/api/tu-ruta-correcta-a-productos', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
            throw new Error(`Error al buscar productos: ${response.status}`);
        }
        
        const productos = await response.json();
        console.log("Productos obtenidos del servidor:", productos);
        
        if (productos && productos.length > 0) {
            // Filtrar productos que coincidan con alguno de los nombres buscados
            const productosCoincidentes = productos.filter(producto => 
                nombresProductos.some(nombre => 
                    producto.nombre?.toLowerCase()?.includes(nombre.toLowerCase()) ||
                    nombre.toLowerCase()?.includes(producto.nombre?.toLowerCase())
                )
            );
            
            if (productosCoincidentes.length > 0) {
                console.log("Productos coincidentes encontrados:", productosCoincidentes);
                actualizarTablaProductos(productosCoincidentes, ordenId);
            }
        }
        */
            } catch (error) {
        console.error("Error al buscar información de productos:", error);
        // Silenciar error para no interrumpir la experiencia del usuario
    }
}

// Función para actualizar la tabla con información de productos
function actualizarTablaProductos(productos, ordenId) {
    try {
        const tablaCuerpo = document.querySelector(`#detalleOrdenContenido .table tbody`);
        if (!tablaCuerpo) return;
        
        // Crear un mapa para buscar productos por nombre
        const productosMap = {};
        productos.forEach(p => {
            const nombreLower = p.nombre?.toLowerCase() || '';
            if (nombreLower) {
                productosMap[nombreLower] = p;
            }
        });
        
        // Actualizar las filas de la tabla
        const filas = tablaCuerpo.querySelectorAll('tr');
        filas.forEach(fila => {
            const nombreCelda = fila.querySelector('td:first-child');
            if (!nombreCelda) return;
            
            const nombreProducto = nombreCelda.textContent.trim().toLowerCase();
            
            // Buscar producto que mejor coincida
            let mejorProducto = null;
            let mejorPuntuacion = 0;
            
            for (const [clave, producto] of Object.entries(productosMap)) {
                if (!clave || !producto) continue;
                
                // Calcular puntuación de coincidencia
                let puntuacion = 0;
                if (nombreProducto.includes(clave)) puntuacion += 2;
                if (clave.includes(nombreProducto)) puntuacion += 1;
                
                if (puntuacion > mejorPuntuacion) {
                    mejorPuntuacion = puntuacion;
                    mejorProducto = producto;
                }
            }
            
            // Si encontramos un producto coincidente, actualizar la fila
            if (mejorProducto && mejorPuntuacion > 0) {
                console.log("Actualizando información para producto:", mejorProducto.nombre);
                
                // Actualizar celda de precio si está disponible
                const precioCelda = fila.querySelector('td:nth-child(3)');
                if (precioCelda && precioCelda.textContent.includes('Consultar') && mejorProducto.precio) {
                    precioCelda.textContent = `$${mejorProducto.precio.toFixed(2)}`;
                    precioCelda.classList.add('text-success');
                    
                    // Actualizar subtotal si está disponible
                    const cantidadCelda = fila.querySelector('td:nth-child(2)');
                    const subtotalCelda = fila.querySelector('td:nth-child(4)');
                    
                    if (cantidadCelda && subtotalCelda && subtotalCelda.textContent.includes('Consultar')) {
                        const cantidad = parseInt(cantidadCelda.textContent.trim()) || 1;
                        const subtotal = cantidad * mejorProducto.precio;
                        subtotalCelda.textContent = `$${subtotal.toFixed(2)}`;
                        subtotalCelda.classList.add('text-success');
                    }
                }
                
                // Añadir tooltip con descripción
                if (mejorProducto.descripcion) {
                    nombreCelda.title = mejorProducto.descripcion;
                    nombreCelda.style.cursor = 'help';
                }
                
                // Resaltar que se ha actualizado la información
                nombreCelda.innerHTML = `<i class="fas fa-box-open text-primary me-2"></i>${nombreCelda.textContent}`;
                fila.style.transition = 'background-color 0.3s';
                fila.style.backgroundColor = '#f8f9fa';
            }
        });
        
        // Actualizar el total en el pie de tabla si todos los precios están disponibles
        const totalElement = document.querySelector(`#detalleOrdenContenido .table tfoot strong`);
        if (totalElement) {
            let total = 0;
            let todosPrecios = true;
            
            filas.forEach(fila => {
                const subtotalCelda = fila.querySelector('td:nth-child(4)');
                if (subtotalCelda && !subtotalCelda.textContent.includes('Consultar')) {
                    const subtotalText = subtotalCelda.textContent.replace('$', '').trim();
                    const subtotal = parseFloat(subtotalText) || 0;
                    total += subtotal;
    } else {
                    todosPrecios = false;
                }
            });
            
            if (todosPrecios && total > 0) {
                totalElement.textContent = `$${total.toFixed(2)}`;
                totalElement.classList.add('text-success');
            }
        }
    } catch (error) {
        console.error("Error al actualizar la tabla con información de productos:", error);
    }
}

// Función para mostrar lista de órdenes con filtros opcionales
async function mostrarListaOrdenes(filtros = {}) {
    try {
        console.log('Mostrando órdenes con filtros:', filtros);
        
        // Obtener el usuario actual y verificar si es admin
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const esAdmin = usuario && usuario.tipo === 'ADMIN';
        
        // Construir URL con parámetros de filtro
        let url = '/api/ordenes';
        const params = new URLSearchParams();
        
        // Añadir filtros a los parámetros
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.tipo) params.append('tipo', filtros.tipo);
        if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
        if (filtros.precioMin) params.append('precioMin', filtros.precioMin);
        if (filtros.precioMax) params.append('precioMax', filtros.precioMax);
        if (filtros.servicioId) params.append('servicioId', filtros.servicioId);
        if (filtros.clienteId) params.append('clienteId', filtros.clienteId);
        if (filtros.ordenarPor) params.append('ordenarPor', filtros.ordenarPor);
        if (filtros.ordenDireccion) params.append('ordenDireccion', filtros.ordenDireccion);
        
        // Añadir parámetros a la URL
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
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
        
        // Realizar la petición al servidor
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.status === 404) {
            console.error('El endpoint de órdenes no está disponible');
            ordenesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    El servicio de órdenes no está disponible en este momento.
                </div>
            `;
            return;
        }

        if (!response.ok) {
            throw new Error(`Error al cargar órdenes: ${response.status} ${response.statusText}`);
        }

        const ordenes = await response.json();
        
        if (!Array.isArray(ordenes) || ordenes.length === 0) {
            ordenesContainer.innerHTML = `
                <div class="alert alert-info alert-dismissible fade show" role="alert">
                    <i class="fas fa-info-circle"></i>
                    No hay órdenes disponibles con los filtros seleccionados.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            return;
        }

        // Generar el HTML para cada orden
        const ordenesHTML = ordenes.map(orden => {
            // Determinar si es una orden de servicio o una compra
            const esCompra = orden.tipo === 'COMPRA';
            
            // Formatear los detalles según el tipo de orden
            let detallesTexto = '';
            
            if (esCompra) {
                // Para compras, mostrar productos
                if (orden.detalles && orden.detalles.length > 0) {
                    detallesTexto = orden.detalles.map(d => `${d.producto?.nombre || d.productoNombre || 'Producto'} (${d.cantidad})`).join(', ');
                } else if (orden.descripcion) {
                    // Intentar extraer información de la descripción si no hay detalles
                    try {
                        const productosRegex = /(\d+)x\s+([^,\n:]+)/g;
                        let match;
                        const productos = [];
                        
                        // Extraer productos con el formato "Nx NombreProducto"
                        while ((match = productosRegex.exec(orden.descripcion)) !== null) {
                            productos.push(`${match[2].trim()} (${match[1]})`);
                        }
                        
                        if (productos.length > 0) {
                            detallesTexto = productos.join(', ');
                        } else {
                            // Si no se encontraron productos con el regex, usar descripción directamente
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
            
            return `
            <div class="card mb-3">
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
                                <strong>Fecha:</strong> ${(orden.fechaProgramada || orden.fecha) ? 
                                new Date(orden.fechaProgramada || orden.fecha).toLocaleDateString() : 
                                'Sin fecha registrada'}
                            </small>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h5 class="text-primary mb-0">$${orden.total || orden.precios?.total || 0.00.toFixed(2)}</h5>
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
        });

        // Actualizar el contenedor con todas las ordenes generadas
        ordenesContainer.innerHTML = ordenesHTML.join('');
        
        // Añadir eventos para ver detalles
        document.querySelectorAll('.ver-detalle-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el elemento que tiene el data-orden-id (podría ser el botón o algún elemento padre)
                const boton = e.target.closest('.ver-detalle-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    mostrarDetalleOrden(ordenId);
                } else {
                    console.error('No se pudo encontrar el ID de la orden');
                }
            });
        });
        
        // Añadir eventos para cancelar órdenes
        document.querySelectorAll('.cancelar-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el elemento que tiene el data-orden-id
                const boton = e.target.closest('.cancelar-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    confirmarCancelarOrden(ordenId);
                } else {
                    console.error('No se pudo encontrar el ID de la orden para cancelar');
                }
            });
        });

        // Añadir eventos para eliminar órdenes
        document.querySelectorAll('.eliminar-orden').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el elemento que tiene el data-orden-id
                const boton = e.target.closest('.eliminar-orden');
                if (boton) {
                    const ordenId = boton.getAttribute('data-orden-id');
                    confirmarEliminarOrden(ordenId);
                } else {
                    console.error('No se pudo encontrar el ID de la orden para eliminar');
                }
            });
        });
    } catch (error) {
        console.error('Error al mostrar órdenes:', error);
        const errorContainer = document.getElementById('listaOrdenes');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error al cargar las órdenes: ${error.message}
                </div>
            `;
        }
    }
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

// Función para confirmar cancelación de una orden
function confirmarCancelarOrden(ordenId) {
    if (!ordenId) return;
    
    Swal.fire({
        title: '¿Cancelar esta orden?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, mantener',
        input: undefined,
        file: undefined,
        select: undefined,
        textarea: undefined
    }).then((result) => {
        if (result.isConfirmed) {
            ordenesManager.cancelarOrden(ordenId);
        }
    });
}

// Función para confirmar eliminación de una orden
function confirmarEliminarOrden(ordenId) {
    if (!ordenId) return;
    
    Swal.fire({
        title: '¿Eliminar esta orden?',
        text: 'Esta acción no se puede deshacer y eliminará todos los datos asociados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'No, mantener',
        input: undefined,
        file: undefined,
        select: undefined,
        textarea: undefined
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarOrden(ordenId);
        }
    });
}

// Función para eliminar una orden
async function eliminarOrden(ordenId) {
    try {
        const response = await fetch(`/api/ordenes/${ordenId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Error al eliminar la orden: ${response.status}`);
        }
        
        mostrarAlerta('Orden eliminada con éxito', 'success');
        
        // Recargar la lista de órdenes
        await mostrarListaOrdenes();
    } catch (error) {
        console.error('Error al eliminar la orden:', error);
        mostrarAlerta(`Error: ${error.message}`, 'danger');
    }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
    const alertasContainer = document.getElementById('alertas');
    if (!alertasContainer) {
        console.error('Contenedor de alertas no encontrado');
        return;
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
            const bsAlert = new bootstrap.Alert(alertaElement);
            bsAlert.close();
        }
    }, 5000);
}
