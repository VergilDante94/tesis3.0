const notificacionesManager = {
    async obtenerNotificaciones() {
        try {
            const response = await fetch(`/api/notificaciones/usuario/${auth.usuario.id}`, {
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            throw error;
        }
    },

    async marcarComoLeida(notificacionId) {
        try {
            const response = await fetch(`/api/notificaciones/${notificacionId}/leer`, {
                method: 'PUT',
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al marcar notificación:', error);
            throw error;
        }
    },

    async marcarTodasComoLeidas() {
        try {
            const response = await fetch(`/api/notificaciones/usuario/${auth.usuario.id}/leer-todas`, {
                method: 'PUT',
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al marcar notificaciones:', error);
            throw error;
        }
    }
};

// Sistema de notificaciones en tiempo real
let notificacionesInterval;

function iniciarNotificaciones() {
    actualizarNotificaciones();
    notificacionesInterval = setInterval(actualizarNotificaciones, 30000); // Actualizar cada 30 segundos
}

function detenerNotificaciones() {
    if (notificacionesInterval) {
        clearInterval(notificacionesInterval);
    }
}

async function actualizarNotificaciones() {
    try {
        const notificaciones = await notificacionesManager.obtenerNotificaciones();
        const notificacionesNoLeidas = notificaciones.filter(n => n.estado === 'PENDIENTE');
        
        // Actualizar contador en el menú
        const contador = document.getElementById('notificacionesContador');
        if (contador) {
            contador.textContent = notificacionesNoLeidas.length;
            contador.style.display = notificacionesNoLeidas.length > 0 ? 'inline' : 'none';
        }

        // Actualizar panel de notificaciones si está visible
        const container = document.getElementById('notificacionesDatos');
        if (container && container.style.display !== 'none') {
            mostrarNotificaciones(notificaciones);
        }
    } catch (error) {
        console.error('Error al actualizar notificaciones:', error);
    }
}

function mostrarNotificaciones(notificaciones) {
    const container = document.getElementById('notificacionesDatos');
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Notificaciones</h3>
            <button class="btn btn-sm btn-secondary" onclick="marcarTodasLeidas()">
                Marcar todas como leídas
            </button>
        </div>
        <div class="list-group">
            ${notificaciones.map(notif => `
                <div class="list-group-item ${notif.estado === 'PENDIENTE' ? 'list-group-item-primary' : ''}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${notif.tipo}</h6>
                        <small>${new Date(notif.fecha).toLocaleString()}</small>
                    </div>
                    <p class="mb-1">${notif.mensaje}</p>
                    ${notif.estado === 'PENDIENTE' ? `
                        <button class="btn btn-sm btn-light mt-2" 
                                onclick="marcarNotificacionLeida(${notif.id})">
                            Marcar como leída
                        </button>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

async function marcarNotificacionLeida(notificacionId) {
    try {
        await notificacionesManager.marcarComoLeida(notificacionId);
        actualizarNotificaciones();
    } catch (error) {
        console.error('Error al marcar notificación:', error);
        alert('Error al marcar la notificación como leída');
    }
}

async function marcarTodasLeidas() {
    try {
        await notificacionesManager.marcarTodasComoLeidas();
        actualizarNotificaciones();
    } catch (error) {
        console.error('Error al marcar notificaciones:', error);
        alert('Error al marcar las notificaciones como leídas');
    }
}
