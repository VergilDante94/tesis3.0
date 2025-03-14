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
async function mostrarListaOrdenes() {
    try {
        const response = await fetch('/api/ordenes', {
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
                    No hay órdenes disponibles.
                </div>
            `;
            return;
        }

        ordenesContainer.innerHTML = ordenes.map(orden => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <strong>Orden #${orden.id}</strong>
                    <span class="badge ${getEstadoBadgeClass(orden.estado)}">${orden.estado}</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Cliente: ${orden.cliente?.usuario?.nombre || 'N/A'}</h5>
                    <p class="card-text">Fecha: ${new Date(orden.fechaCreacion).toLocaleDateString()}</p>
                    <div class="servicios-lista">
                        <h6>Servicios:</h6>
                        <ul class="list-group">
                            ${orden.servicios?.map(s => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>${s.servicio?.nombre || 'N/A'}</span>
                                    <span class="badge bg-secondary">x${s.cantidad}</span>
                                </li>
                            `).join('') || ''}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
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

    // Añadir buscador de servicios
    const buscadorHTML = `
        <div class="col-12 mb-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <div class="input-group">
                                <span class="input-group-text bg-primary text-white">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input type="text" id="buscarServicio" class="form-control" 
                                       placeholder="Buscar servicio por nombre o descripción..."
                                       style="background-color: #ffffff; color: #212529;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    console.log(`Mostrando ${servicios.length} servicios...`);
    const serviciosHTML = servicios.map(servicio => {
        if (!servicio.id || !servicio.nombre) {
            console.error('Servicio inválido:', servicio);
            return '';
        }

        // Determinar el texto del tipo de servicio
        const tipoServicio = servicio.tipo === 'POR_HORA' ? 'Por Hora' : 'Por Cantidad';
        const unidad = servicio.tipo === 'POR_HORA' ? '/hora' : '/unidad';

        return `
            <div class="col-md-6 mb-4 servicio-item">
                <div class="card h-100 shadow-sm" data-id="${servicio.id}" data-tipo="${servicio.tipo}">
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

    container.innerHTML = `
        <div class="row">
            ${buscadorHTML}
            <div id="listaServiciosDisponibles" class="row w-100">
                ${serviciosHTML}
            </div>
        </div>
    `;

    // Configurar buscador de servicios
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
    
    console.log('Servicios mostrados correctamente');
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
    setTimeout(() => {
        // Aplicar a elementos específicos
        const fechaProgramada = document.getElementById('fechaProgramada');
        if (fechaProgramada) {
            fechaProgramada.style.backgroundColor = '#ffffff';
            fechaProgramada.style.color = '#212529';
            console.log('Estilos aplicados a fechaProgramada');
        }
        
        const descripcion = document.getElementById('descripcion');
        if (descripcion) {
            descripcion.style.backgroundColor = '#ffffff';
            descripcion.style.color = '#212529';
            console.log('Estilos aplicados a descripcion');
        }
        
        // Aplicar a todos los inputs dentro del formulario
        const ordenesForm = document.getElementById('ordenesForm');
        if (ordenesForm) {
            ordenesForm.querySelectorAll('input, textarea, select').forEach(el => {
                el.style.backgroundColor = '#ffffff';
                el.style.color = '#212529';
                console.log('Estilos aplicados a elemento de formulario:', el.id || el.name || 'sin id');
            });
        }
    }, 300);
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertaDiv.role = 'alert';
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertaDiv);
    
    setTimeout(() => {
        alertaDiv.remove();
    }, 3000);
}

// Configurar el formulario de órdenes
document.addEventListener('DOMContentLoaded', function() {
    // Añadir estilos para mejorar la visualización en modo claro y modo oscuro
    const estilosPersonalizados = document.createElement('style');
    estilosPersonalizados.textContent = `
        /* Mejoras para modo claro */
        .card {
            border: 1px solid rgba(0, 0, 0, 0.125) !important;
        }
        
        .list-group-item {
            border: 1px solid rgba(0, 0, 0, 0.125) !important;
        }
        
        /* Corregir campos de formulario en modo claro */
        input.form-control,
        textarea.form-control,
        select.form-control {
            background-color: #ffffff !important;
            color: #212529 !important;
            border: 1px solid #ced4da !important;
        }
        
        /* Forzar input date/time a modo claro */
        input[type="datetime-local"],
        input[type="date"],
        input[type="time"],
        input[type="number"] {
            background-color: #ffffff !important;
            color: #212529 !important;
            border: 1px solid #ced4da !important;
        }
        
        /* Asegurar contraste adecuado */
        .text-dark {
            color: #343a40 !important;
        }
        
        .badge {
            font-weight: 500;
        }
        
        /* Estilos para tarjetas de servicios */
        .servicio-item .card:hover {
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            transition: box-shadow 0.3s ease;
        }
        
        /* Corregir contraste en resumen de orden */
        #resumenOrden {
            background-color: #ffffff !important;
        }
        
        #serviciosSeleccionados .list-group-item {
            background-color: #ffffff !important;
            color: #212529 !important;
        }
        
        /* Reglas para modo oscuro (activadas por preferencias del sistema) */
        @media (prefers-color-scheme: dark) {
            /* Fondos para tarjetas y contenedores en modo oscuro */
            .card {
                background-color: #343a40 !important;
                border-color: #495057 !important;
            }
            
            .card-header {
                background-color: #212529 !important;
                border-color: #495057 !important;
                color: #f8f9fa !important;
            }
            
            /* Hacer que los textos sean visibles en modo oscuro */
            .card-text.text-dark,
            p.card-text, 
            .card-text {
                color: #f8f9fa !important;
            }
            
            /* Mejorar contraste en modo oscuro */
            .text-dark {
                color: #f8f9fa !important;
            }
            
            /* Elementos de lista */
            .list-group-item {
                background-color: #343a40 !important;
                border-color: #495057 !important;
                color: #f8f9fa !important;
            }
            
            /* Mejorar contraste para elementos de texto específicos */
            .card-body p.text-dark,
            .card-body h6.text-dark,
            .card-body .mb-0.text-dark,
            .card-body strong,
            .card-title,
            h5, h6, p, span:not(.badge) {
                color: #f8f9fa !important;
            }
            
            /* Mantener los colores de badges y botones */
            .badge.bg-info {
                color: #fff !important;
            }
            
            /* Resumen de orden en modo oscuro */
            #resumenOrden {
                background-color: #343a40 !important;
            }
            
            #resumenOrden .card-header {
                color: #f8f9fa !important;
            }
            
            #serviciosSeleccionados .list-group-item {
                background-color: #343a40 !important;
                color: #f8f9fa !important;
            }
        }
    `;
    
    document.head.appendChild(estilosPersonalizados);
    
    // Hacer visible todos los inputs correctamente después de que se cargue el DOM
    setTimeout(() => {
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#212529';
        });
    }, 500);
    
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
                const response = await fetch('/api/ordenes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        servicios: ordenesState.serviciosSeleccionados.map(s => ({
                            servicioId: s.id,
                            cantidad: s.cantidad
                        })),
                        fechaProgramada,
                        descripcion
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al crear la orden');
                }

                const orden = await response.json();
                mostrarAlerta('Orden creada exitosamente', 'success');
                
                // Limpiar el formulario y mostrar la lista de órdenes
                ordenesState.serviciosSeleccionados = [];
                document.getElementById('nuevaOrdenForm').style.display = 'none';
                document.getElementById('listaOrdenes').style.display = 'block';
                await mostrarListaOrdenes();
            } catch (error) {
                console.error('Error al crear orden:', error);
                mostrarAlerta('Error al crear la orden: ' + error.message, 'danger');
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