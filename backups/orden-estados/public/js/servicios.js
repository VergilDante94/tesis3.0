// Variables globales
let modalServicio = null;
let servicioIdAEliminar = null; // Variable para almacenar el ID del servicio a eliminar
let modalConfirm;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚨 Inicializando script de servicios...');
    
    // Inicializar el modal
    const modalServicioEl = document.getElementById('modalServicio');
    if (modalServicioEl) {
        modalServicio = new bootstrap.Modal(modalServicioEl);
        console.log('Modal servicio inicializado correctamente');
    } else {
        console.error('Elemento del modal servicio no encontrado');
    }
    
    // Inicializar el modal de confirmación si existe
    const modalEl = document.getElementById('modalConfirmacion');
    if (modalEl) {
        console.log('🚨 Elemento modal encontrado, inicializando...');
        modalConfirm = new bootstrap.Modal(modalEl);
        
        // Asignar evento al botón confirmar del modal
        const btnConfirmar = document.getElementById('btnConfirmarEliminar');
        if (btnConfirmar) {
            console.log('🚨 Botón confirmar encontrado, asignando evento...');
            btnConfirmar.addEventListener('click', function() {
                console.log('🚨 Botón confirmar clickeado, ID a eliminar:', servicioIdAEliminar);
                if (servicioIdAEliminar) {
                    // Ocultar el modal
                    modalConfirm.hide();
                    // Ejecutar la eliminación después de que se oculte el modal
                    setTimeout(() => {
                        eliminarServicioDirecto(servicioIdAEliminar);
                    }, 300);
                } else {
                    console.error('🚨 No hay ID de servicio para eliminar');
                }
            });
        } else {
            console.error('🚨 No se encontró el botón confirmar eliminar');
        }
    } else {
        console.error('🚨 No se encontró el elemento modal de confirmación');
    }
    
    // Cargar servicios inicialmente
    loadServices();
    
    // Event listener para el cambio de tipo de servicio
    const tipoSelect = document.getElementById('servicio-tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', actualizarEtiquetaPrecio);
    } else {
        console.warn('Elemento servicio-tipo no encontrado');
    }
});

// Función para cargar servicios
async function loadServices() {
    try {
        console.log('Cargando servicios... Usuario es admin:', window.getUserInfo()?.tipo === 'ADMIN');
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/servicios', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar servicios');
        }

        const servicios = await response.json();
        console.log('Servicios cargados:', servicios);
        mostrarServicios(servicios, window.getUserInfo()?.tipo === 'ADMIN');
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta(error.message, 'danger');
    }
}

// Función para mostrar los servicios en el contenedor
function mostrarServicios(servicios, isAdmin) {
    const container = document.getElementById('servicios-container');
    
    // Filtrar solo servicios activos
    const serviciosActivos = servicios.filter(servicio => servicio.estado === 'ACTIVO');
    
    if (serviciosActivos.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    No hay servicios disponibles en este momento.
                </div>
            </div>
        `;
        return;
    }

    console.log('Generando HTML para', serviciosActivos.length, 'servicios activos. isAdmin:', isAdmin);
    
    // Crear el HTML con formularios para la eliminación
    container.innerHTML = serviciosActivos.map(servicio => `
        <div class="col-md-4 mb-4 servicio-card" id="servicio-${servicio.id}">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${servicio.nombre}</h5>
                    <p class="card-text">${servicio.descripcion}</p>
                    <div class="mb-2">
                        <span class="badge bg-primary">${servicio.tipo === 'POR_HORA' ? 'Por Hora' : 'Por Cantidad'}</span>
                    </div>
                    <p class="card-text">
                        <strong>Precio:</strong> $${servicio.precioBase.toFixed(2)}
                        ${servicio.tipo === 'POR_HORA' ? '/hora' : '/unidad'}
                    </p>
                    ${isAdmin ? `
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary me-1 btn-editar" data-id="${servicio.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger btn-eliminar" data-id="${servicio.id}" data-nombre="${servicio.nombre}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Configurar eventos
    if (isAdmin) {
        console.log('Configurando eventos para botones...');
        
        // Eventos para botones de editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            const id = btn.getAttribute('data-id');
            btn.addEventListener('click', function() {
                console.log('Botón editar clickeado para ID:', id);
                editarServicio(parseInt(id));
            });
        });
        
        // Eventos para botones de eliminar, usando el modal de confirmación
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            const id = parseInt(btn.getAttribute('data-id'));
            const nombre = btn.getAttribute('data-nombre');
            
            btn.addEventListener('click', function() {
                console.log('🌟 Botón eliminar clickeado para ID:', id);
                confirmarEliminarServicio(id, nombre);
            });
        });
    }
}

// Función para actualizar la etiqueta de precio según el tipo de servicio
function actualizarEtiquetaPrecio() {
    const tipo = document.getElementById('servicio-tipo').value;
    const label = document.getElementById('precio-unidad');
    if (label) {
        label.textContent = tipo === 'POR_HORA' ? '/hora' : '/unidad';
    } else {
        console.warn('Elemento con ID "precio-unidad" no encontrado');
    }
}

// Función para mostrar el modal de nuevo servicio
function nuevoServicio() {
    document.getElementById('servicioForm').reset();
    document.getElementById('servicio-id').value = '';
    document.getElementById('modalServiceTitle').textContent = 'Nuevo Servicio';
    actualizarEtiquetaPrecio();
    modalServicio.show();
}

// Función para editar un servicio existente
async function editarServicio(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/servicios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar servicio');
        
        const servicio = await response.json();
        
        // Llenar formulario
        document.getElementById('servicio-id').value = servicio.id;
        document.getElementById('servicio-nombre').value = servicio.nombre;
        document.getElementById('servicio-descripcion').value = servicio.descripcion;
        document.getElementById('servicio-tipo').value = servicio.tipo;
        document.getElementById('servicio-precioBase').value = servicio.precioBase;
        
        actualizarEtiquetaPrecio();
        document.getElementById('modalServiceTitle').textContent = 'Editar Servicio';
        modalServicio.show();
    } catch (error) {
        console.error('Error al cargar servicio:', error);
        mostrarAlerta('Error al cargar servicio', 'danger');
    }
}

// Función para guardar un servicio (nuevo o existente)
async function guardarServicio() {
    try {
        const token = localStorage.getItem('token');
        const servicioId = document.getElementById('servicio-id').value;
        
        const servicio = {
            nombre: document.getElementById('servicio-nombre').value,
            descripcion: document.getElementById('servicio-descripcion').value,
            tipo: document.getElementById('servicio-tipo').value,
            precioBase: parseFloat(document.getElementById('servicio-precioBase').value),
            estado: 'ACTIVO'
        };

        const url = servicioId ? `/api/servicios/${servicioId}` : '/api/servicios';
        const method = servicioId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(servicio)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar servicio');
        }

        modalServicio.hide();
        mostrarAlerta('Servicio guardado correctamente', 'success');
        loadServices();
    } catch (error) {
        console.error('Error al guardar servicio:', error);
        mostrarAlerta(error.message, 'danger');
    }
}

// Función para mostrar el modal de confirmación
function confirmarEliminarServicio(id, nombre) {
    console.log('🚨 Mostrando modal de confirmación para eliminar servicio:', id, nombre);
    
    // Almacenar el ID para usarlo cuando se confirme
    servicioIdAEliminar = id;
    
    // Actualizar el texto del modal con el nombre del servicio
    const modalBody = document.getElementById('modalConfirmacion').querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <p>¿Está seguro de que desea eliminar el servicio <strong>"${nombre}"</strong>?</p>
            <p class="text-danger"><small>Esta acción no se puede deshacer.</small></p>
        `;
    }
    
    // Mostrar el modal
    if (modalConfirm) {
        modalConfirm.show();
    } else {
        // Fallback por si el modal no está disponible
        if (confirm(`¿Está seguro de que desea eliminar el servicio "${nombre}"?`)) {
            eliminarServicioDirecto(id);
        }
    }
}

// Función que realmente elimina el servicio (llamada desde el botón de confirmación)
function eliminarServicioDirecto(id) {
    console.log('🚨 Iniciando eliminación directa para ID:', id);
    
    // Obtener token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('🚨 No hay token disponible');
        mostrarAlertaMejorada('No hay token de autenticación', 'danger');
        return;
    }
    
    // Añadir efecto visual al elemento que se va a eliminar
    const servicioCard = document.getElementById(`servicio-${id}`);
    if (servicioCard) {
        servicioCard.style.transition = 'all 0.5s ease';
        servicioCard.style.opacity = '0.5';
        servicioCard.style.transform = 'scale(0.95)';
    }
    
    // Mostrar indicador de progreso
    const alerta = mostrarAlertaMejorada('Eliminando servicio...', 'info', false);
    
    // Realizar solicitud DELETE
    console.log('🚨 Enviando solicitud DELETE...');
    
    fetch(`/api/servicios/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('🚨 Respuesta recibida:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('🚨 Eliminación exitosa:', data);
        
        if (servicioCard) {
            servicioCard.style.opacity = '0';
            servicioCard.style.transform = 'scale(0.8)';
        }
        
        // Cerrar la alerta de progreso si existe
        if (alerta && document.body.contains(alerta)) {
            document.body.removeChild(alerta);
        }
        
        // Mostrar mensaje de éxito
        mostrarAlertaMejorada('Servicio eliminado correctamente', 'success');
        
        // Recargar la lista después de un breve retraso
        setTimeout(() => loadServices(), 500);
    })
    .catch(error => {
        console.error('🚨 Error en la eliminación:', error);
        
        // Restaurar la apariencia del servicio
        if (servicioCard) {
            servicioCard.style.opacity = '1';
            servicioCard.style.transform = 'scale(1)';
        }
        
        // Cerrar la alerta de progreso
        if (alerta && document.body.contains(alerta)) {
            document.body.removeChild(alerta);
        }
        
        mostrarAlertaMejorada('Error al eliminar: ' + error.message, 'danger');
    });
}

// Versión mejorada de mostrarAlerta
function mostrarAlertaMejorada(mensaje, tipo, autoCerrar = true) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertaDiv.role = 'alert';
    alertaDiv.style.zIndex = '9999';
    alertaDiv.style.minWidth = '300px';
    alertaDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    // Agregar icono según el tipo
    let icono = 'info-circle';
    if (tipo === 'success') icono = 'check-circle';
    if (tipo === 'danger') icono = 'exclamation-triangle';
    if (tipo === 'warning') icono = 'exclamation-circle';
    
    alertaDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${icono} me-2"></i>
            <div>${mensaje}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertaDiv);
    
    if (autoCerrar) {
        setTimeout(() => {
            if (document.body.contains(alertaDiv)) {
                document.body.removeChild(alertaDiv);
            }
        }, 3000);
    }
    
    return alertaDiv;
}

// Mantener función eliminarServicio por compatibilidad (redirige a la nueva implementación)
function eliminarServicio(id) {
    console.log('Función eliminarServicio llamada, redirigiendo a nueva implementación');
    eliminarServicioDirecto(id);
}

// Exponer funciones necesarias globalmente
window.nuevoServicio = nuevoServicio;
window.editarServicio = editarServicio;
window.guardarServicio = guardarServicio;
window.eliminarServicio = eliminarServicio;

// Verificar que las funciones están expuestas correctamente
console.log('Verificando funciones globales:',
    'nuevoServicio:', typeof window.nuevoServicio === 'function' ? 'OK' : 'NO',
    'editarServicio:', typeof window.editarServicio === 'function' ? 'OK' : 'NO',
    'guardarServicio:', typeof window.guardarServicio === 'function' ? 'OK' : 'NO',
    'eliminarServicio:', typeof window.eliminarServicio === 'function' ? 'OK' : 'NO'
);

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .eliminar-animacion {
        transition: all 0.5s ease-out;
    }
`;
document.head.appendChild(style); 