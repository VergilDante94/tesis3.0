// Archivo: public/js/notificaciones.js

// --- NOTIFICACIONES ---
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

let notificacionesInterval;

function iniciarNotificaciones() {
    console.log('[NOTIF DEBUG] iniciarNotificaciones called');
    actualizarNotificaciones();
    notificacionesInterval = setInterval(actualizarNotificaciones, 30000); // 30s
}

function detenerNotificaciones() {
    console.log('[NOTIF DEBUG] detenerNotificaciones called');
    if (notificacionesInterval) {
        clearInterval(notificacionesInterval);
    }
}

async function actualizarNotificaciones() {
    console.log('[NOTIF DEBUG] actualizarNotificaciones called');
    try {
        const notificaciones = await notificacionesManager.obtenerNotificaciones();
        console.log('[NOTIF DEBUG] notificaciones obtenidas:', notificaciones);
        const notificacionesNoLeidas = notificaciones.filter(n => n.estado === 'PENDIENTE');
        // Actualizar contador en el menú
        const contador = document.getElementById('notificacionesContador');
        if (contador) {
            contador.textContent = notificacionesNoLeidas.length;
            contador.style.display = notificacionesNoLeidas.length > 0 ? 'inline' : 'none';
        }
        // Actualizar panel de notificaciones si está visible
        const container = document.getElementById('notificacionesDatos');
        if (container && container.offsetParent !== null) {
            mostrarNotificaciones(notificaciones);
        }
    } catch (error) {
        console.error('[NOTIF DEBUG] Error al actualizar notificaciones:', error);
    }
}

// Adaptación para notificaciones.html (cargar en #notificacionesList)
async function cargarNotificaciones() {
    const container = document.getElementById('notificacionesList');
    if (container) {
        container.innerHTML = '<div class="loader" aria-label="Cargando notificaciones..."></div>';
    }
    let timeoutId;
    try {
        // Mostrar mensaje si tarda más de 3 segundos
        timeoutId = setTimeout(() => {
            if (container) {
                container.innerHTML = '<div class="alert alert-info">La carga de notificaciones está tardando más de lo normal...</div>';
            }
        }, 3000);
        if (typeof auth === 'undefined' || !auth.usuario) {
            if (container) container.innerHTML = '<div class="alert alert-warning">Debes iniciar sesión para ver tus notificaciones.</div>';
            return;
        }
        console.log('[NOTIF DEBUG] cargarNotificaciones: auth.usuario', auth.usuario);
        const tFetch0 = performance.now();
        const notificaciones = await notificacionesManager.obtenerNotificaciones();
        const tFetch1 = performance.now();
        console.log(`[NOTIF PERF] obtenerNotificaciones (fetch) tardó ${(tFetch1-tFetch0).toFixed(2)} ms`);
        clearTimeout(timeoutId);
        console.log('[NOTIF DEBUG] cargarNotificaciones: notificaciones', notificaciones);
        const t0 = performance.now();
        mostrarNotificaciones(notificaciones, true); // true: modo notificaciones.html
        const t1 = performance.now();
        console.log(`[NOTIF PERF] mostrarNotificaciones ejecutada en ${(t1-t0).toFixed(2)} ms`);
        // Log después de mostrar notificaciones
        setTimeout(() => {
            if (!container) return;
            const loader = container.querySelector('.loader');
            if (!loader) {
                console.log('[NOTIF PERF] Loader oculto tras renderizado');
            } else {
                console.log('[NOTIF PERF] Loader sigue visible tras renderizado');
            }
        }, 0);
    } catch (error) {
        clearTimeout(timeoutId);
        if (container) container.innerHTML = '<div class="alert alert-danger">Error al cargar notificaciones.</div>';
        console.error('[NOTIF DEBUG] Error en cargarNotificaciones:', error);
    }
}

function mostrarNotificaciones(notificaciones, enNotificacionesHtml = false) {
    const t0 = performance.now();
    console.log('[NOTIF DEBUG] mostrarNotificaciones', {notificaciones, enNotificacionesHtml});
    const container = enNotificacionesHtml ? document.getElementById('notificacionesList') : document.getElementById('notificacionesDatos');
    if (!container) return;
    container.innerHTML = '';
    if (!notificaciones.length) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info';
        infoDiv.textContent = 'No tienes notificaciones.';
        container.appendChild(infoDiv);
        return;
    }
    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';
    const fragment = document.createDocumentFragment();
    for (const notif of notificaciones) {
        const item = document.createElement('div');
        item.className = 'list-group-item' + (notif.estado === 'PENDIENTE' ? ' list-group-item-primary' : '');
        // Cabecera
        const header = document.createElement('div');
        header.className = 'd-flex w-100 justify-content-between';
        const tipo = document.createElement('h6');
        tipo.className = 'mb-1';
        tipo.textContent = notif.tipo;
        const fecha = document.createElement('small');
        fecha.textContent = new Date(notif.fecha).toLocaleString();
        header.appendChild(tipo);
        header.appendChild(fecha);
        // Mensaje
        const mensaje = document.createElement('p');
        mensaje.className = 'mb-1';
        mensaje.textContent = notif.mensaje;
        // Botón marcar como leída
        item.appendChild(header);
        item.appendChild(mensaje);
        if (notif.estado === 'PENDIENTE') {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-light mt-2';
            btn.textContent = 'Marcar como leída';
            btn.onclick = () => marcarNotificacionLeida(notif.id);
            item.appendChild(btn);
        }
        listGroup.appendChild(item);
    }
    fragment.appendChild(listGroup);
    container.appendChild(fragment);
    const t1 = performance.now();
    console.log(`[NOTIF PERF] mostrarNotificaciones DOM update: ${(t1-t0).toFixed(2)} ms`);
    // Log después de actualizar el DOM
    setTimeout(() => {
        if (!container) return;
        const loader = container.querySelector('.loader');
        if (!loader) {
            console.log('[NOTIF PERF] Loader oculto tras mostrarNotificaciones');
        } else {
            console.log('[NOTIF PERF] Loader sigue visible tras mostrarNotificaciones');
        }
    }, 0);
}

async function marcarNotificacionLeida(notificacionId) {
    console.log('[NOTIF DEBUG] marcarNotificacionLeida', notificacionId);
    try {
        await notificacionesManager.marcarComoLeida(notificacionId);
        if (esNotificacionesHtml()) {
            cargarNotificaciones();
        } else {
            actualizarNotificaciones();
        }
    } catch (error) {
        console.error('[NOTIF DEBUG] Error al marcar notificación:', error);
        alert('Error al marcar la notificación como leída');
    }
}

async function marcarTodasLeidas() {
    console.log('[NOTIF DEBUG] marcarTodasLeidas called');
    try {
        await notificacionesManager.marcarTodasComoLeidas();
        if (esNotificacionesHtml()) {
            cargarNotificaciones();
        } else {
            actualizarNotificaciones();
        }
    } catch (error) {
        console.error('[NOTIF DEBUG] Error al marcar notificaciones:', error);
        alert('Error al marcar las notificaciones como leídas');
    }
}

// Exponer cargarNotificaciones globalmente para notificaciones.html
window.cargarNotificaciones = cargarNotificaciones;

// ** NOTA: Exponer funciones necesarias globalmente si script.js las llama directamente **
// window.cargarNotificaciones = cargarNotificaciones; // Podría ser necesario dependiendo de cómo script.js llama a esta función

// ** En el siguiente paso, integraremos esta función con la lógica de navegación **