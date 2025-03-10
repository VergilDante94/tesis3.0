document.addEventListener('DOMContentLoaded', function() {
    loadServices();
});

async function loadServices() {
    try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(atob(token));
        const isAdmin = userData.tipo === 'ADMIN';
        
        console.log('Cargando servicios... Usuario es admin:', isAdmin);

        const response = await fetch('/api/servicios', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar servicios');
        }

        const servicios = await response.json();
        const container = document.getElementById('servicios-container');
        
        // Mostrar botón de nuevo servicio si es admin
        const btnNuevoServicio = document.querySelector('.btn-primary.admin-only');
        if (btnNuevoServicio) {
            btnNuevoServicio.style.display = isAdmin ? 'block' : 'none';
        }

        container.innerHTML = servicios.map(servicio => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${servicio.nombre}</h5>
                        <p class="card-text">${servicio.descripcion}</p>
                        <p class="card-text"><strong>Precio Base:</strong> $${servicio.precioBase}</p>
                        <p class="card-text"><strong>Duración:</strong> ${servicio.duracionHoras} horas</p>
                        ${isAdmin ? `
                            <div class="btn-group admin-only" style="display: block;">
                                <button class="btn btn-sm btn-primary" onclick="editarServicio(${servicio.id})">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="eliminarServicio(${servicio.id})">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error al cargar servicios:', error);
        mostrarAlerta('Error al cargar servicios', 'danger');
    }
}

function createServiceCard(servicio) {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.innerHTML = `
        <div class="card h-100 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <h5 class="card-title">${servicio.nombre}</h5>
                    <div class="admin-only" style="display: none;">
                        <button class="btn btn-sm btn-outline-primary me-1" 
                                onclick="editarServicio(${servicio.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="eliminarServicio(${servicio.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="card-text">${servicio.descripcion}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <p class="mb-0"><strong>Precio Base:</strong> $${servicio.precioBase.toFixed(2)}</p>
                        <p class="mb-0"><strong>Duración:</strong> ${servicio.duracionHoras} horas</p>
                    </div>
                    <button class="btn btn-primary solicitar-servicio" 
                            data-servicio-id="${servicio.id}"
                            onclick="solicitarServicio(${servicio.id})">
                        Solicitar
                    </button>
                </div>
            </div>
        </div>
    `;
    return card;
}

function getUserType() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Si el token está en formato JWT (contiene puntos)
        if (token.includes('.')) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.tipo;
        }
        
        // Si el token está en formato simple (solo base64)
        const payload = JSON.parse(atob(token));
        console.log('Payload del token:', payload); // Para debugging
        return payload.tipo;
    } catch (error) {
        console.error('Error al decodificar el token:', error);
        return null;
    }
}

function solicitarServicio(servicioId) {
    // Por ahora solo mostraremos un mensaje
    console.log(`Solicitando servicio ${servicioId}`);
    mostrarAlerta('Función de solicitud en desarrollo', 'info');
}

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

// Función para crear un nuevo servicio (agregar esta función también)
function nuevoServicio() {
    // Verificar si es administrador
    const token = localStorage.getItem('token');
    const userData = JSON.parse(atob(token));
    if (userData.tipo !== 'ADMIN') {
        mostrarAlerta('No tienes permisos para crear servicios', 'danger');
        return;
    }

    // Mostrar modal de nuevo servicio
    const modal = new bootstrap.Modal(document.getElementById('modalServicio'));
    document.getElementById('servicioForm').reset();
    document.getElementById('modalTitle').textContent = 'Nuevo Servicio';
    modal.show();
}

// Función para editar servicio
async function editarServicio(id) {
    // Verificar si es administrador
    const token = localStorage.getItem('token');
    const userData = JSON.parse(atob(token));
    if (userData.tipo !== 'ADMIN') {
        mostrarAlerta('No tienes permisos para editar servicios', 'danger');
        return;
    }

    try {
        const response = await fetch(`/api/servicios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar servicio');
        
        const servicio = await response.json();
        const modal = new bootstrap.Modal(document.getElementById('modalServicio'));
        
        // Llenar formulario
        document.getElementById('servicioId').value = servicio.id;
        document.getElementById('nombre').value = servicio.nombre;
        document.getElementById('descripcion').value = servicio.descripcion;
        document.getElementById('precioBase').value = servicio.precioBase;
        document.getElementById('duracionHoras').value = servicio.duracionHoras;
        
        document.getElementById('modalTitle').textContent = 'Editar Servicio';
        modal.show();
    } catch (error) {
        console.error('Error al cargar servicio:', error);
        mostrarAlerta('Error al cargar servicio', 'danger');
    }
}

// Función para eliminar servicio
async function eliminarServicio(id) {
    // Verificar si es administrador
    const token = localStorage.getItem('token');
    const userData = JSON.parse(atob(token));
    if (userData.tipo !== 'ADMIN') {
        mostrarAlerta('No tienes permisos para eliminar servicios', 'danger');
        return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
        return;
    }

    try {
        const response = await fetch(`/api/servicios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar servicio');

        mostrarAlerta('Servicio eliminado correctamente', 'success');
        loadServices(); // Recargar lista
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        mostrarAlerta('Error al eliminar servicio', 'danger');
    }
}

function displayServices(servicios, isAdmin) {
    const container = document.getElementById('servicios-container');
    if (!container) {
        console.error('No se encontró el contenedor de servicios');
        return;
    }

    // Limpiar el contenedor
    container.innerHTML = '';

    // Mostrar/ocultar el botón de nuevo servicio según el rol
    const btnNuevoServicio = document.querySelector('.admin-only[onclick="nuevoServicio()"]');
    if (btnNuevoServicio) {
        btnNuevoServicio.style.display = isAdmin ? '' : 'none';
    }

    if (servicios.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No hay servicios disponibles</p>
            </div>
        `;
        return;
    }

    // Crear y agregar las tarjetas de servicios
    servicios.forEach(servicio => {
        const card = createServiceCard(servicio);
        container.appendChild(card);
    });

    // Mostrar/ocultar elementos administrativos
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = isAdmin ? '' : 'none';
    });
}

// Asegurarse de que estas funciones estén disponibles globalmente
window.nuevoServicio = nuevoServicio;
window.editarServicio = editarServicio;
window.eliminarServicio = eliminarServicio;
window.solicitarServicio = solicitarServicio; 
window.solicitarServicio = solicitarServicio; 