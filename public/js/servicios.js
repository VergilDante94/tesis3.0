document.addEventListener('DOMContentLoaded', function() {
    loadServices();
});

async function loadServices() {
    try {
        const response = await fetch('/api/servicios');
        const servicios = await response.json();
        
        const contenedorServicios = document.getElementById('servicios-container');
        contenedorServicios.innerHTML = '';

        servicios.forEach(servicio => {
            const servicioCard = createServiceCard(servicio);
            contenedorServicios.appendChild(servicioCard);
        });

        // Manejo mejorado de permisos
        handleAdminPermissions();

    } catch (error) {
        console.error('Error al cargar los servicios:', error);
        mostrarAlerta('Error al cargar los servicios', 'error');
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
        const payload = JSON.parse(atob(token.split('.')[1]));
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

// Nueva función para manejar permisos de administrador
function handleAdminPermissions() {
    const userType = getUserType();
    const isAdmin = userType === 'ADMIN';
    
    // Manejar botón "Nuevo Servicio"
    const btnNuevoServicio = document.getElementById('btn-nuevo-servicio');
    if (btnNuevoServicio) {
        btnNuevoServicio.style.display = isAdmin ? 'block' : 'none';
    }

    // Manejar botones de edición en las tarjetas de servicios
    const botonesEdicion = document.querySelectorAll('.admin-only');
    botonesEdicion.forEach(boton => {
        boton.style.display = isAdmin ? 'block' : 'none';
    });
}

// Funciones para administradores
async function editarServicio(id) {
    if (getUserType() !== 'ADMIN') {
        mostrarAlerta('No tienes permisos para editar servicios', 'warning');
        return;
    }
    // TODO: Implementar lógica de edición
    console.log(`Editando servicio ${id}`);
    mostrarAlerta('Función de edición en desarrollo', 'info');
}

async function eliminarServicio(id) {
    if (getUserType() !== 'ADMIN') {
        mostrarAlerta('No tienes permisos para eliminar servicios', 'warning');
        return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
        return;
    }

    try {
        const response = await fetch(`/api/servicios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            mostrarAlerta('Servicio eliminado correctamente', 'success');
            loadServices(); // Recargar la lista de servicios
        } else {
            throw new Error('Error al eliminar el servicio');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar el servicio', 'error');
    }
} 