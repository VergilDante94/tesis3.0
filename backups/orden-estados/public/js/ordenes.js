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
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al listar órdenes:', error);
            throw error;
        }
    },

    async actualizarEstado(ordenId, estado) {
        try {
            const response = await fetch(`/api/ordenes/${ordenId}/estado`, {
                method: 'PUT',
                headers: auth.getHeaders(),
                body: JSON.stringify({ estado })
            });
            return await response.json();
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

// Función para mostrar lista de órdenes
async function mostrarListaOrdenes(filtros = {}) {
    try {
        // Construir URL con parámetros de filtrado
        let url = '/api/ordenes';
        const queryParams = new URLSearchParams();
        
        // Añadir filtros a los query params
        Object.entries(filtros).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });
        
        // Añadir los query params a la URL si hay alguno
        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.status === 404) {
            console.log('El endpoint de órdenes no está disponible');
            const ordenesContainer = document.getElementById('listaOrdenes');
            if (ordenesContainer) {
                ordenesContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        El servicio de órdenes no está disponible en este momento.
                    </div>
                `;
            }
            return;
        }

        if (!response.ok) {
            throw new Error('Error al cargar órdenes');
        }

        const ordenes = await response.json();
        const ordenesContainer = document.getElementById('listaOrdenes');
        
        if (!ordenesContainer) {
            console.log('Contenedor de órdenes no encontrado');
            return;
        }

        if (!Array.isArray(ordenes) || ordenes.length === 0) {
            ordenesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay órdenes disponibles con los filtros seleccionados.
                </div>
            `;
            return;
        }

        ordenesContainer.innerHTML = ordenes.map(orden => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center bg-light">
                    <div>
                        <span class="badge bg-primary me-2">ID: ${orden.id}</span>
                        <span class="badge ${getEstadoBadgeClass(orden.estado)}">${orden.estado}</span>
                    </div>
                    <div>
                        ${orden.estado === 'PENDIENTE' ? 
                        `<button class="btn btn-sm btn-outline-danger me-2 cancelar-orden" 
                                data-orden-id="${orden.id}">
                            <i class="fas fa-times-circle"></i> Cancelar
                        </button>` : ''}
                        <button class="btn btn-sm btn-outline-primary ver-detalle-orden" 
                                data-orden-id="${orden.id}">Ver detalles</button>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Cliente: ${orden.cliente?.usuario?.nombre || 'N/A'}</h5>
                    <p class="card-text">Email: ${orden.cliente?.usuario?.email || 'N/A'}</p>
                    <p class="card-text">Fecha: ${orden.fechaFormateada || new Date(orden.fecha).toLocaleDateString()}</p>
                    
                    <div class="servicios-lista">
                        <h6>Servicios:</h6>
                        <ul class="list-group">
                            ${orden.servicios?.map(s => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>${s.servicio?.nombre || 'N/A'}</span>
                                    <span class="badge bg-secondary me-2">x${s.cantidad}</span>
                                    <span class="precio">$${s.precioUnitario * s.cantidad}</span>
                                </li>
                            `).join('') || ''}
                        </ul>
                    </div>
                    
                    <div class="mt-3 precios-resumen">
                        <div class="d-flex justify-content-between">
                            <span>Subtotal:</span>
                            <strong>$${orden.precios?.subtotal.toFixed(2) || 'N/A'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Total:</span>
                            <strong class="text-primary">$${orden.precios?.total.toFixed(2) || 'N/A'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Añadir eventos para ver detalles
        document.querySelectorAll('.ver-detalle-orden').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ordenId = e.target.dataset.ordenId;
                mostrarDetalleOrden(ordenId);
            });
        });
        
        // Añadir eventos para cancelar órdenes
        document.querySelectorAll('.cancelar-orden').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ordenId = btn.dataset.ordenId;
                confirmarCancelarOrden(ordenId);
            });
        });
    } catch (error) {
        console.error('Error al mostrar órdenes:', error);
        const ordenesContainer = document.getElementById('listaOrdenes');
        if (ordenesContainer) {
            ordenesContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error al cargar las órdenes: ${error.message}
                </div>
            `;
        }
    }
}

// Función para mostrar detalle de una orden específica
async function mostrarDetalleOrden(ordenId) {
    try {
        const response = await fetch(`/api/ordenes/${ordenId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los detalles de la orden');
        }

        const orden = await response.json();
        
        // Crear modal para mostrar detalles
        const modalHtml = `
            <div class="modal fade" id="detalleOrdenModal" tabindex="-1" aria-labelledby="detalleOrdenModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="detalleOrdenModalLabel">
                                <span class="badge bg-primary me-2">Orden ID: ${orden.id}</span>
                                <span class="badge ${getEstadoBadgeClass(orden.estado)}">${orden.estado}</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p><strong>Cliente:</strong> ${orden.cliente?.usuario?.nombre || 'N/A'}</p>
                                    <p><strong>Email:</strong> ${orden.cliente?.usuario?.email || 'N/A'}</p>
                                    <p><strong>Dirección:</strong> ${orden.cliente?.direccion || 'N/A'}</p>
                                    <p><strong>Teléfono:</strong> ${orden.cliente?.telefono || 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Fecha:</strong> ${orden.fechaFormateada || new Date(orden.fecha).toLocaleDateString()}</p>
                                    <p><strong>Fecha de creación:</strong> ${new Date(orden.createdAt || orden.fecha).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <h6>Detalle de Servicios:</h6>
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Servicio</th>
                                        <th>Descripción</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unit.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${orden.detallesServicios ? orden.detallesServicios.map(s => `
                                        <tr>
                                            <td>${s.nombre}</td>
                                            <td>${s.descripcion}</td>
                                            <td>${s.cantidad}</td>
                                            <td>$${s.precioUnitario.toFixed(2)}</td>
                                            <td>$${s.subtotal.toFixed(2)}</td>
                                        </tr>
                                    `).join('') : orden.servicios.map(s => `
                                        <tr>
                                            <td>${s.servicio.nombre}</td>
                                            <td>${s.servicio.descripcion}</td>
                                            <td>${s.cantidad}</td>
                                            <td>$${s.precioUnitario.toFixed(2)}</td>
                                            <td>$${(s.cantidad * s.precioUnitario).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="4" class="text-end"><strong>Subtotal:</strong></td>
                                        <td>$${orden.precios?.subtotal.toFixed(2) || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="4" class="text-end"><strong>Total:</strong></td>
                                        <td class="text-primary"><strong>$${orden.precios?.total.toFixed(2) || 'N/A'}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${orden.estado === 'PENDIENTE' ? 
                                `<button type="button" class="btn btn-primary" id="btnImprimirFactura" data-orden-id="${orden.id}">
                                    Generar Factura
                                </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir modal al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('detalleOrdenModal'));
        modal.show();
        
        // Evento para generar factura
        const btnImprimirFactura = document.getElementById('btnImprimirFactura');
        if (btnImprimirFactura) {
            btnImprimirFactura.addEventListener('click', () => {
                generarFactura(orden.id);
            });
        }
        
        // Limpiar DOM cuando se cierre el modal
        document.getElementById('detalleOrdenModal').addEventListener('hidden.bs.modal', function () {
            document.body.removeChild(modalContainer);
        });
        
    } catch (error) {
        console.error('Error al mostrar detalles de la orden:', error);
        mostrarAlerta('Error al cargar los detalles de la orden', 'danger');
    }
}

// Función auxiliar para determinar la clase de badge según el estado
function getEstadoBadgeClass(estado) {
    switch (estado) {
        case 'PENDIENTE':
            return 'bg-warning text-dark';
        case 'PROGRAMADA':
            return 'bg-info text-white';
        case 'EN_PROCESO':
            return 'bg-primary text-white';
        case 'COMPLETADA':
            return 'bg-success text-white';
        case 'CANCELADA':
            return 'bg-danger text-white';
        default:
            return 'bg-secondary text-white';
    }
}

// Función para cargar servicios disponibles para órdenes
async function loadServicesForOrders() {
    console.log('Iniciando carga de servicios para órdenes...');
    try {
        const token = localStorage.getItem('token');
        const userData = window.decodeJWT(token);
        if (!userData) {
            console.error('No hay token válido disponible');
            mostrarAlerta('Error de autenticación', 'danger');
            return;
        }

        // Mostrar la lista de órdenes existentes
        await mostrarListaOrdenes();

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
            <div id="listaServiciosDisponibles" class="row w-100">
                ${serviciosHTML}
            </div>
        </div>
    `;
    
    // Verificar si existe el módulo de filtros y utilizarlo
    if (window.filtrosManager) {
        window.filtrosManager.inicializarFiltro('#serviciosDisponibles', '.servicio-item');
    } else {
        console.warn('El módulo de filtros no está disponible. Asegúrate de incluir filtros.js en tu HTML.');
        // Usar el filtro básico como respaldo
        const buscarServicioInput = document.createElement('input');
        buscarServicioInput.type = 'text';
        buscarServicioInput.id = 'buscarServicio';
        buscarServicioInput.className = 'form-control mb-3';
        buscarServicioInput.placeholder = 'Buscar servicio...';
        buscarServicioInput.style = 'background-color: #ffffff; color: #212529;';
        
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
        
        // Insertar el input de búsqueda al principio del contenedor
        const listaServicios = document.getElementById('listaServiciosDisponibles');
        if (listaServicios) {
            listaServicios.parentNode.insertBefore(buscarServicioInput, listaServicios);
        }
    }
}

// Función para seleccionar un servicio
function seleccionarServicio(servicioId, nombre, precioBase, tipo = 'POR_HORA') {
    console.log('Seleccionando servicio:', servicioId);
    
    // Obtener tipo de servicio del elemento seleccionado
    const tipoElement = document.querySelector(`[data-id="${servicioId}"]`);
    if (tipoElement) {
        tipo = tipoElement.dataset.tipo;
    }
    
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
    mostrarFormularioNuevaOrden();
    mostrarAlerta(`Servicio agregado: ${nombre} x ${cantidad}`, 'success');
}

// Función para actualizar el resumen de la orden
function actualizarResumenOrden() {
    const resumenDiv = document.getElementById('serviciosSeleccionados');
    const totalSpan = document.getElementById('totalOrden');
    const resumenContainer = document.getElementById('resumenOrden');

    if (!resumenDiv || !totalSpan || !resumenContainer) {
        console.error('No se encontraron los elementos necesarios para el resumen');
        return;
    }

    resumenContainer.style.display = 'block';

    if (ordenesState.serviciosSeleccionados.length === 0) {
        resumenDiv.innerHTML = '<p class="text-muted">No hay servicios seleccionados</p>';
        totalSpan.textContent = '0.00';
        return;
    }

    const total = ordenesState.serviciosSeleccionados.reduce((sum, s) => sum + s.total, 0);
    ordenesState.total = total;

    resumenDiv.innerHTML = `
        <div class="list-group">
            ${ordenesState.serviciosSeleccionados.map(s => {
                const unidad = s.tipo === 'POR_HORA' ? '/hora' : '/unidad';
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${s.nombre}</h6>
                            <small>
                                ${s.cantidad} x $${s.precioBase.toFixed(2)}${unidad}
                                <span class="badge bg-info ms-2">${s.tipo === 'POR_HORA' ? 'Por Hora' : 'Por Cantidad'}</span>
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="mb-2">$${s.total.toFixed(2)}</div>
                            <button type="button" class="btn btn-sm btn-danger" 
                                    onclick="eliminarServicio(${s.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    totalSpan.textContent = total.toFixed(2);
    
    // Aplicar estilos a los campos del formulario
    fixFormFields();
}

// Función para eliminar un servicio del resumen
function eliminarServicio(servicioId) {
    ordenesState.serviciosSeleccionados = ordenesState.serviciosSeleccionados.filter(s => s.id !== servicioId);
    actualizarResumenOrden();
    if (ordenesState.serviciosSeleccionados.length === 0) {
        document.getElementById('resumenOrden').style.display = 'none';
    }
    mostrarAlerta('Servicio eliminado', 'info');
}

// Función para mostrar el formulario de nueva orden
function mostrarFormularioNuevaOrden() {
    const formContainer = document.getElementById('nuevaOrdenForm');
    if (formContainer) {
        formContainer.style.display = 'block';
        
        // Añadir botón de cancelar si no existe
        const botonesContainer = formContainer.querySelector('.text-end');
        if (botonesContainer && !document.getElementById('btnCancelarOrden')) {
            const btnCancelar = document.createElement('button');
            btnCancelar.id = 'btnCancelarOrden';
            btnCancelar.type = 'button';
            btnCancelar.className = 'btn btn-outline-danger me-2';
            btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar';
            btnCancelar.style = 'font-weight: 500; padding: 8px 16px;';
            btnCancelar.onclick = cancelarNuevaOrden;
            botonesContainer.insertBefore(btnCancelar, botonesContainer.firstChild);
        }
    }
}

// Función para cancelar la creación de una nueva orden
function cancelarNuevaOrden() {
    if (confirm('¿Estás seguro de que deseas cancelar la creación de esta orden? Se perderán todos los datos ingresados.')) {
        // Limpiar el estado
        ordenesState.serviciosSeleccionados = [];
        ordenesState.total = 0;
        
        // Ocultar el formulario
        const formContainer = document.getElementById('nuevaOrdenForm');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
        
        // Mostrar la lista de órdenes
        const listaOrdenes = document.getElementById('listaOrdenes');
        if (listaOrdenes) {
            listaOrdenes.style.display = 'block';
        }
        
        // Limpiar el resumen
        const resumenOrden = document.getElementById('resumenOrden');
        if (resumenOrden) {
            resumenOrden.style.display = 'none';
        }
        
        // Mostrar mensaje de cancelación
        mostrarAlerta('Creación de orden cancelada', 'info');
    }
}

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
        
        // Añadir botón de cancelar si no existe
        const botonesContainer = formContainer.querySelector('.text-end');
        if (botonesContainer && !document.getElementById('btnCancelarOrden')) {
            const btnCancelar = document.createElement('button');
            btnCancelar.id = 'btnCancelarOrden';
            btnCancelar.type = 'button';
            btnCancelar.className = 'btn btn-outline-danger me-2';
            btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar';
            btnCancelar.style = 'font-weight: 500; padding: 8px 16px;';
            btnCancelar.onclick = cancelarNuevaOrden;
            botonesContainer.insertBefore(btnCancelar, botonesContainer.firstChild);
        }
    }
    
    // Limpiar el resumen
    const resumenOrden = document.getElementById('resumenOrden');
    if (resumenOrden) {
        resumenOrden.style.display = 'none';
    }
    
    // Cargar servicios disponibles
    loadServicesForOrders();
    
    // Asegurar que los campos del formulario tengan el estilo correcto
    fixFormFields();
}

// Función para arreglar los campos de formulario
function fixFormFields() {
    console.log('Aplicando estilos a campos de formulario...');
    
    // No añadir estilos duplicados, solo aplicar directamente a los elementos
    setTimeout(() => {
        // Aplicar a elementos específicos con prioridad
        const fechaProgramada = document.getElementById('fechaProgramada');
        if (fechaProgramada) {
            fechaProgramada.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
            console.log('Estilos aplicados a fechaProgramada');
        }
        
        const descripcion = document.getElementById('descripcion');
        if (descripcion) {
            descripcion.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
            console.log('Estilos aplicados a descripcion');
        }
        
        // Aplicar a todos los inputs dentro del formulario de órdenes
        const ordenesForm = document.getElementById('ordenesForm');
        if (ordenesForm) {
            ordenesForm.querySelectorAll('input, textarea, select').forEach(el => {
                el.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
                console.log('Estilos aplicados a elemento de formulario:', el.id || el.name || 'sin id');
            });
        }
        
        // Buscar específicamente inputs de cantidad en tarjetas de servicios
        document.querySelectorAll('.servicio-item input[type="number"]').forEach(el => {
            el.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
            console.log('Estilos aplicados a input de cantidad en tarjeta de servicio');
        });
        
        // Aplicar al buscador de servicios
        const buscarServicio = document.getElementById('buscarServicio');
        if (buscarServicio) {
            buscarServicio.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
            console.log('Estilos aplicados al buscador de servicios');
        }
    }, 300);
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo, duracion = 5000) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow-lg`;
    alertaDiv.style.zIndex = '9999';
    alertaDiv.style.minWidth = '300px';
    alertaDiv.role = 'alert';
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertaDiv);
    
    // Añadir animación de desaparición gradual
    const timeoutId = setTimeout(() => {
        alertaDiv.classList.add('fade-out');
        setTimeout(() => {
            alertaDiv.remove();
        }, 300);
    }, duracion);
    
    // Detener el temporizador si el usuario cierra manualmente
    alertaDiv.querySelector('.btn-close').addEventListener('click', () => {
        clearTimeout(timeoutId);
    });
    
    // Añadir estilo para la animación de desaparición
    const style = document.createElement('style');
    style.textContent = `
        .fade-out {
            opacity: 0;
            transition: opacity 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
    
    return alertaDiv; // Retornar el elemento por si se necesita manipular posteriormente
}

// Configurar el formulario de órdenes
document.addEventListener('DOMContentLoaded', function() {
    // Añadir estilos para mejorar la visualización en modo claro y oscuro
    const estilosPersonalizados = document.createElement('style');
    estilosPersonalizados.textContent = `
        /* ESTILOS FORZADOS PARA MODO CLARO - Alta especificidad */
        html body input,
        html body textarea,
        html body select,
        html body .form-control,
        html body input.form-control,
        html body textarea.form-control,
        html body select.form-control,
        html body input[type="text"],
        html body input[type="number"],
        html body input[type="datetime-local"],
        html body input[type="date"],
        html body input[type="time"] {
            background-color: #ffffff !important;
            color: #212529 !important;
            border: 1px solid #ced4da !important;
        }
        
        /* ESTILOS BASE PARA APLICAR SIEMPRE */
        .card {
            background-color: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.125);
            color: #212529;
        }
        
        .card-header {
            background-color: #f8f9fa;
            border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        }
        
        .card-title {
            color: #0d6efd;
        }
        
        .card-text,
        p, 
        h5, 
        h6 {
            color: #212529;
        }
        
        .list-group-item {
            background-color: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.125);
            color: #212529;
        }
        
        /* Entradas de formulario */
        input.form-control,
        textarea.form-control,
        select.form-control {
            background-color: #ffffff !important;
            color: #212529 !important;
            border: 1px solid #ced4da;
        }
        
        /* Estilos específicos para tipos de input especiales */
        input[type="datetime-local"],
        input[type="date"],
        input[type="time"],
        input[type="number"] {
            background-color: #ffffff !important;
            color: #212529 !important;
            border: 1px solid #ced4da;
        }
        
        /* ===================== ESTILOS COMPARTIDOS ===================== */
        /* Estilos para tarjetas de servicios (animación hover) */
        .servicio-item .card:hover {
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            transition: box-shadow 0.3s ease;
        }
        
        /* Badges y botones conservan sus estilos originales */
        .badge {
            font-weight: 500;
        }
    `;
    
    document.head.appendChild(estilosPersonalizados);
    
    // Hacer visible todos los inputs y aplicar estilos inline
    function aplicarEstilosFormularios() {
        console.log('Aplicando estilos inline a todos los elementos de formulario...');
        
        // Identificar todos los inputs y aplicarles estilo directamente
        document.querySelectorAll('input, textarea, select, .form-control').forEach(el => {
            el.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
        });
        
        // Específicamente apuntar a los inputs en tarjetas de servicios
        document.querySelectorAll('.servicio-item input[type="number"]').forEach(el => {
            el.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important; width: 80px;');
        });
        
        // Aplicar al buscador de servicios
        const buscarServicio = document.getElementById('buscarServicio');
        if (buscarServicio) {
            buscarServicio.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
        }
        
        // Aplicar a los campos específicos del formulario de órdenes
        const fechaProgramada = document.getElementById('fechaProgramada');
        if (fechaProgramada) {
            fechaProgramada.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
        }
        
        const descripcion = document.getElementById('descripcion');
        if (descripcion) {
            descripcion.setAttribute('style', 'background-color: #ffffff !important; color: #212529 !important; border: 1px solid #ced4da !important;');
        }
    }
    
    // Ejecutar ahora
    aplicarEstilosFormularios();
    
    // Y también después de un retraso
    setTimeout(aplicarEstilosFormularios, 500);
    setTimeout(aplicarEstilosFormularios, 1000);
    
    // Configurar un observador para ajustar estilos cuando cambie el DOM
    try {
        const observer = new MutationObserver(function() {
            aplicarEstilosFormularios();
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: false,
            characterData: false
        });
        
        console.log('Observador de mutaciones configurado para aplicar estilos automáticamente');
    } catch (e) {
        console.error('Error al configurar observador:', e);
        // Si falla el observador, aplicar estilos periódicamente
        setInterval(aplicarEstilosFormularios, 2000);
    }
    
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

// Exportar todas las funciones necesarias al objeto window
window.ordenesManager = ordenesManager;
window.mostrarFormularioOrden = mostrarFormularioOrden;
window.mostrarListaOrdenes = mostrarListaOrdenes;
window.loadServicesForOrders = loadServicesForOrders;
window.displayServicesForOrders = displayServicesForOrders;
window.seleccionarServicio = seleccionarServicio;
window.eliminarServicio = eliminarServicio;
window.nuevaOrden = nuevaOrden;
window.mostrarAlerta = mostrarAlerta;
window.fixFormFields = fixFormFields;
window.cancelarNuevaOrden = cancelarNuevaOrden;

// Función para cargar servicios en el filtro
async function cargarServiciosParaFiltro() {
    try {
        // Añadir headers de autenticación
        const response = await fetch('/api/servicios', {
            headers: auth.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar servicios');
        }
        
        const servicios = await response.json();
        const filtroServicio = document.getElementById('filtroServicio');
        
        if (filtroServicio) {
            // Mantener la primera opción "Todos los servicios"
            const defaultOption = filtroServicio.querySelector('option');
            filtroServicio.innerHTML = '';
            if (defaultOption) {
                filtroServicio.appendChild(defaultOption);
            }
            
            // Añadir opciones de servicios
            servicios.forEach(servicio => {
                const option = document.createElement('option');
                option.value = servicio.id;
                option.textContent = servicio.nombre;
                filtroServicio.appendChild(option);
            });
            
            // Mensaje de éxito en consola para debugging
            console.log(`Cargados ${servicios.length} servicios para el filtro`);
        }
    } catch (error) {
        console.error('Error al cargar servicios para filtro:', error);
        // Mostrar un alert más discreto para no interrumpir la experiencia del usuario
        mostrarAlerta(`No se pudieron cargar los servicios para el filtro: ${error.message}`, 'warning', 3000);
    }
}

// Función para aplicar filtros
function aplicarFiltros() {
    const filtros = {
        estado: document.getElementById('filtroEstado')?.value,
        fechaDesde: document.getElementById('filtroFechaDesde')?.value,
        fechaHasta: document.getElementById('filtroFechaHasta')?.value,
        precioMinimo: document.getElementById('filtroPrecioMin')?.value,
        precioMaximo: document.getElementById('filtroPrecioMax')?.value,
        servicioId: document.getElementById('filtroServicio')?.value,
        ordenarPor: document.getElementById('filtroOrdenarPor')?.value,
        ordenDireccion: document.getElementById('filtroOrdenDireccion')?.value
    };
    
    // Eliminar campos vacíos para no enviarlos como parámetros
    Object.keys(filtros).forEach(key => {
        if (!filtros[key]) {
            delete filtros[key];
        }
    });
    
    // Guardar filtros en sessionStorage para recordarlos
    sessionStorage.setItem('ordenes_filtros', JSON.stringify(filtros));
    
    // Mostrar lista de órdenes filtradas
    mostrarListaOrdenes(filtros);
}

// Función para limpiar filtros
function limpiarFiltros() {
    const formFiltros = document.getElementById('filtroOrdenesForm');
    if (formFiltros) {
        formFiltros.reset();
        sessionStorage.removeItem('ordenes_filtros');
        mostrarListaOrdenes();
    }
}

// Función para inicializar los filtros
function inicializarFiltros() {
    // Cargar servicios para el filtro
    cargarServiciosParaFiltro();
    
    // Restaurar filtros guardados (si existen)
    const filtrosGuardados = sessionStorage.getItem('ordenes_filtros');
    if (filtrosGuardados) {
        const filtros = JSON.parse(filtrosGuardados);
        
        // Aplicar valores a los campos
        if (filtros.estado) document.getElementById('filtroEstado').value = filtros.estado;
        if (filtros.fechaDesde) document.getElementById('filtroFechaDesde').value = filtros.fechaDesde;
        if (filtros.fechaHasta) document.getElementById('filtroFechaHasta').value = filtros.fechaHasta;
        if (filtros.precioMinimo) document.getElementById('filtroPrecioMin').value = filtros.precioMinimo;
        if (filtros.precioMaximo) document.getElementById('filtroPrecioMax').value = filtros.precioMaximo;
        if (filtros.servicioId) {
            // Es posible que primero necesitemos esperar a que los servicios carguen
            const intervalId = setInterval(() => {
                const select = document.getElementById('filtroServicio');
                if (select && select.options.length > 1) {
                    select.value = filtros.servicioId;
                    clearInterval(intervalId);
                }
            }, 100);
            // Establecer un tiempo máximo de espera
            setTimeout(() => clearInterval(intervalId), 5000);
        }
        if (filtros.ordenarPor) document.getElementById('filtroOrdenarPor').value = filtros.ordenarPor;
        if (filtros.ordenDireccion) document.getElementById('filtroOrdenDireccion').value = filtros.ordenDireccion;
        
        // Aplicar los filtros restaurados
        mostrarListaOrdenes(filtros);
    } else {
        // Si no hay filtros guardados, mostrar todas las órdenes
        mostrarListaOrdenes();
    }
    
    // Asignar eventos a los botones
    document.getElementById('aplicarFiltros')?.addEventListener('click', aplicarFiltros);
    document.getElementById('limpiarFiltros')?.addEventListener('click', limpiarFiltros);
}

// Añadir inicialización de filtros al cargar el módulo de órdenes
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de órdenes
    if (document.getElementById('ordenes')) {
        // Inicializar filtros cuando se muestre la sección de órdenes
        document.querySelectorAll('[data-section="ordenes"]').forEach(link => {
            link.addEventListener('click', function() {
                inicializarFiltros();
            });
        });
        
        // Comprobar si la sección de órdenes es visible (para manejar recarga de página)
        if (document.getElementById('ordenes').style.display !== 'none') {
            inicializarFiltros();
        }
    }
});

// Función para generar factura de una orden
async function generarFactura(ordenId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            mostrarAlerta('Debes iniciar sesión para generar facturas', 'warning');
            return;
        }

        // Mostrar indicador de carga
        const btnFactura = document.getElementById('btnImprimirFactura');
        if (btnFactura) {
            btnFactura.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generando...';
            btnFactura.disabled = true;
        }

        const response = await fetch(`/api/facturas/generar/${ordenId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // Restaurar botón
        if (btnFactura) {
            btnFactura.innerHTML = 'Generar Factura';
            btnFactura.disabled = false;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al generar factura');
        }

        const factura = await response.json();
        
        // Cerrar modal actual si existe
        const modalActual = document.getElementById('detalleOrdenModal');
        if (modalActual) {
            const instancia = bootstrap.Modal.getInstance(modalActual);
            if (instancia) {
                instancia.hide();
            }
        }
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Factura generada correctamente', 'success');
        
        // Opcional: Mostrar enlace para descargar la factura
        if (factura.archivoPath) {
            // Construir modal de confirmación
            const modalHtml = `
                <div class="modal fade" id="facturaGeneradaModal" tabindex="-1" aria-labelledby="facturaGeneradaLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="facturaGeneradaLabel">Factura Generada</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>La factura se ha generado correctamente.</p>
                                <p>Número de factura: <strong>${factura.numeroFactura || 'No disponible'}</strong></p>
                                <p>Fecha: <strong>${new Date(factura.fechaEmision).toLocaleDateString()}</strong></p>
                                <p>Total: <strong>$${factura.total.toFixed(2)}</strong></p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                <a href="${factura.archivoPath}" class="btn btn-primary" target="_blank">
                                    <i class="fas fa-download"></i> Descargar Factura
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Añadir modal al DOM
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('facturaGeneradaModal'));
            modal.show();
            
            // Limpiar DOM cuando se cierre el modal
            document.getElementById('facturaGeneradaModal').addEventListener('hidden.bs.modal', function () {
                document.body.removeChild(modalContainer);
            });
        }
        
        // Actualizar lista de órdenes para reflejar el cambio
        mostrarListaOrdenes();
        
    } catch (error) {
        console.error('Error al generar factura:', error);
        mostrarAlerta(`Error al generar factura: ${error.message}`, 'danger');
    }
}

// Función para limpiar el historial de órdenes
async function limpiarHistorialOrdenes() {
    if (confirm('¿Estás seguro de que deseas limpiar el historial de órdenes? Esta acción no eliminará las órdenes del servidor, solo limpiará la visualización actual.')) {
        // Limpiar filtros
        const formFiltros = document.getElementById('filtroOrdenesForm');
        if (formFiltros) {
            formFiltros.reset();
        }
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('ordenes_filtros');
        
        // Vaciar el contenedor de órdenes y mostrar mensaje temporal
        const ordenesContainer = document.getElementById('listaOrdenes');
        if (ordenesContainer) {
            ordenesContainer.innerHTML = `
                <div id="mensaje-historial-limpiado" class="alert alert-info fade show">
                    <i class="fas fa-info-circle"></i>
                    Historial de órdenes limpiado. Puedes aplicar filtros para ver órdenes.
                </div>
            `;
            
            // Configurar el temporizador para ocultar el mensaje después de 5 segundos
            setTimeout(() => {
                const mensaje = document.getElementById('mensaje-historial-limpiado');
                if (mensaje) {
                    // Añadir clase para animación de desvanecimiento
                    mensaje.classList.add('fade-out');
                    
                    // Después de la animación, reemplazar con un contenedor vacío
                    setTimeout(() => {
                        if (mensaje.parentNode) {
                            ordenesContainer.innerHTML = `
                                <div class="d-flex justify-content-center align-items-center p-5">
                                    <button id="mostrar-ordenes-btn" class="btn btn-outline-primary">
                                        <i class="fas fa-search"></i> Ver Órdenes
                                    </button>
                                </div>
                            `;
                            
                            // Añadir evento al botón para mostrar órdenes
                            const btnMostrarOrdenes = document.getElementById('mostrar-ordenes-btn');
                            if (btnMostrarOrdenes) {
                                btnMostrarOrdenes.addEventListener('click', () => {
                                    mostrarListaOrdenes();
                                });
                            }
                        }
                    }, 300); // Tiempo para la animación de desvanecimiento
                }
            }, 5000); // 5 segundos antes de ocultar
        }
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Historial de órdenes limpiado correctamente', 'success');
    }
}

// Asegurar que el estilo para la animación de desvanecimiento esté disponible
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya existe el estilo
    if (!document.getElementById('fade-out-style')) {
        const style = document.createElement('style');
        style.id = 'fade-out-style';
        style.textContent = `
            .fade-out {
                opacity: 0;
                transition: opacity 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
});

// Añadir inicialización del botón de limpiar historial
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de órdenes
    if (document.getElementById('ordenes')) {
        // Inicializar filtros cuando se muestre la sección de órdenes
        document.querySelectorAll('[data-section="ordenes"]').forEach(link => {
            link.addEventListener('click', function() {
                inicializarFiltros();
                inicializarBotones();
            });
        });
        
        // Comprobar si la sección de órdenes es visible (para manejar recarga de página)
        if (document.getElementById('ordenes').style.display !== 'none') {
            inicializarFiltros();
            inicializarBotones();
        }
    }
});

// Función para inicializar botones
function inicializarBotones() {
    // Botón para limpiar historial
    const btnLimpiarHistorial = document.getElementById('limpiarHistorialOrdenes');
    if (btnLimpiarHistorial) {
        btnLimpiarHistorial.addEventListener('click', limpiarHistorialOrdenes);
    }
}

// Función para confirmar la cancelación de una orden
function confirmarCancelarOrden(ordenId) {
    if (confirm('¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.')) {
        ordenesManager.cancelarOrden(ordenId)
            .then(() => {
                mostrarAlerta('Orden cancelada con éxito', 'success');
                // Recargar la lista de órdenes
                mostrarListaOrdenes();
            })
            .catch(error => {
                console.error('Error al cancelar la orden:', error);
                mostrarAlerta(`Error: ${error.message}`, 'danger');
            });
    }
}
