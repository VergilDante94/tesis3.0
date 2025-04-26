const notificacionesManager = {
    async obtenerNotificaciones() {
        try {
            // Verificar si auth y usuario existen
            if (!auth || !auth.usuario) {
                console.warn('Usuario no autenticado o no inicializado completamente');
                return [];
            }
            
            const response = await fetch(`/api/notificaciones/usuario/${auth.usuario.id}`, {
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            return []; // Devolver array vacío en caso de error
        }
    },

    async marcarComoLeida(notificacionId) {
        try {
            // Verificar si auth y usuario existen
            if (!auth || !auth.usuario) {
                console.warn('Usuario no autenticado o no inicializado completamente');
                return { success: false };
            }
            
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
            // Verificar si auth y usuario existen
            if (!auth || !auth.usuario) {
                console.warn('Usuario no autenticado o no inicializado completamente');
                return { success: false };
            }
            
            const response = await fetch(`/api/notificaciones/usuario/${auth.usuario.id}/leer-todas`, {
                method: 'PUT',
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al marcar notificaciones:', error);
            throw error;
        }
    },

    async crearNotificacion(usuarioId, tipo, mensaje) {
        try {
            // Verificar autenticación
            if (!auth || !auth.usuario) {
                console.warn('Usuario no autenticado o no inicializado completamente');
                return { success: false };
            }
            
            const response = await fetch(`/api/notificaciones`, {
                method: 'POST',
                headers: auth.getHeaders(),
                body: JSON.stringify({
                    usuarioId,
                    tipo,
                    mensaje
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al crear notificación:', error);
            throw error;
        }
    },

    async notificarAdmins(tipo, mensaje) {
        try {
            // Verificar autenticación
            if (!auth || !auth.usuario) {
                console.warn('Usuario no autenticado o no inicializado completamente');
                return { success: false };
            }
            
            const response = await fetch(`/api/notificaciones/admins`, {
                method: 'POST',
                headers: auth.getHeaders(),
                body: JSON.stringify({
                    tipo,
                    mensaje
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al notificar a administradores:', error);
            throw error;
        }
    }
};

// Sistema de notificaciones en tiempo real
let notificacionesInterval;

function iniciarNotificaciones() {
    // Verificar si auth y usuario existen
    console.log('[NotificacionesDebug] Iniciando sistema de notificaciones, estado auth:', {
        auth: typeof auth,
        initialized: auth && auth.initialized,
        token: auth && auth.token ? 'presente' : 'ausente',
        usuario: auth && auth.usuario
    });
    
    // Intentar recuperar el usuario desde localStorage
    if (!auth || !auth.usuario) {
        console.warn('Usuario no autenticado o no inicializado completamente, no se puede iniciar notificaciones');
        
        try {
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            if (usuarioGuardado && usuarioGuardado.id) {
                console.log('[NotificacionesDebug] Usuario recuperado desde localStorage:', usuarioGuardado);
                // Actualizar auth
                if (auth) {
                    auth.usuario = usuarioGuardado;
                    auth.initialized = true;
                    auth.token = localStorage.getItem('token');
                    console.log('[NotificacionesDebug] Objeto auth actualizado con localStorage');
                }
            } else {
                return; // Salir si no hay usuario
            }
        } catch (e) {
            console.error('[NotificacionesDebug] Error al recuperar usuario:', e);
            return;
        }
    }
    
    // Verificar autenticación de manera segura
    const estaAutenticado = auth && (typeof auth.estaAutenticado === 'function' ? 
        auth.estaAutenticado() : !!localStorage.getItem('token'));
    
    if (!auth || !auth.usuario || !estaAutenticado) {
        console.warn('[NotificacionesDebug] Verificación de autenticación falló, no se iniciará el sistema de notificaciones');
        return;
    }
    
    console.log('Iniciando sistema de notificaciones para usuario:', auth.usuario.id);
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
        // Verificar si auth existe y está inicializado
        console.log('[NotificacionesDebug] Actualizando notificaciones, estado auth:', {
            auth: typeof auth,
            initialized: auth && auth.initialized,
            usuario: auth && auth.usuario
        });
        
        // Siempre intentar recargar el objeto auth desde localStorage
        if (!auth || !auth.usuario) {
            console.warn('[NotificacionesDebug] Auth no inicializado, intentando recargar desde localStorage');
            try {
                const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
                if (usuarioGuardado && usuarioGuardado.id) {
                    if (auth) {
                        auth.usuario = usuarioGuardado;
                        auth.initialized = true;
                        auth.token = localStorage.getItem('token');
                        console.log('[NotificacionesDebug] Auth recargado exitosamente:', auth.usuario);
                    }
                }
            } catch (e) {
                console.error('[NotificacionesDebug] Error al recargar auth desde localStorage:', e);
            }
        }
        
        // Verificar autenticación de manera segura
        const estaAutenticado = auth && (typeof auth.estaAutenticado === 'function' ? 
            auth.estaAutenticado() : !!localStorage.getItem('token'));
        
        if (!auth || !auth.usuario || !estaAutenticado) {
            console.warn('Usuario no autenticado o no inicializado completamente, omitiendo actualización');
            return;
        }
        
        const notificaciones = await notificacionesManager.obtenerNotificaciones();
        
        // Verificar que notificaciones sea un array
        if (!Array.isArray(notificaciones)) {
            console.warn('[NotificacionesDebug] La respuesta no es un array:', notificaciones);
            // Si no hay ruta de notificaciones en el backend, mostrar un mensaje y mostrar array vacío
            const container = document.getElementById('notificacionesDatos');
            if (container && container.style.display !== 'none') {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        El servicio de notificaciones no está disponible en este momento.
                    </div>
                `;
            }
            
            // Actualizar contador a 0
            const contador = document.getElementById('notificacionesContador');
            if (contador) {
                contador.textContent = '0';
                contador.style.display = 'none';
            }
            return;
        }
        
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
        
        // Manejo de error
        const container = document.getElementById('notificacionesDatos');
        if (container && container.style.display !== 'none') {
            container.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar notificaciones: ${error.message || 'Error desconocido'}
                </div>
            `;
        }
    }
}

function mostrarNotificaciones(notificaciones) {
    const container = document.getElementById('notificacionesDatos');
    
    if (!container) {
        console.warn('Contenedor de notificaciones no encontrado');
        return;
    }
    
    // Asegurar que notificaciones sea un array
    if (!Array.isArray(notificaciones)) {
        console.warn('mostrarNotificaciones: notificaciones no es un array', notificaciones);
        notificaciones = [];
    }
    
    if (notificaciones.length === 0) {
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3>Notificaciones</h3>
            </div>
            <div class="alert alert-info">
                No tienes notificaciones nuevas
            </div>
        `;
        return;
    }
    
    // Ordenar notificaciones con las pendientes primero y luego por fecha
    notificaciones.sort((a, b) => {
        // Primero por estado (PENDIENTE primero)
        if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
        if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
        // Luego por fecha (más reciente primero)
        return new Date(b.fecha) - new Date(a.fecha);
    });
    
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

// Exponer funciones en el objeto window
window.marcarNotificacionLeida = marcarNotificacionLeida;
window.marcarTodasLeidas = marcarTodasLeidas;
window.iniciarNotificaciones = iniciarNotificaciones;
window.detenerNotificaciones = detenerNotificaciones;
window.actualizarNotificaciones = actualizarNotificaciones;

// Función helper para crear notificaciones a todos los usuarios
async function notificarTodosUsuarios(tipo, mensaje) {
    try {
        // Obtener todos los usuarios
        const response = await fetch('/api/usuarios', {
            headers: auth.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener la lista de usuarios');
        }
        
        const usuarios = await response.json();
        
        // Verificar que tengamos un array de usuarios
        if (!Array.isArray(usuarios)) {
            throw new Error('La respuesta no es un array de usuarios');
        }
        
        console.log(`Enviando notificación a ${usuarios.length} usuarios`);
        
        // Crear notificación para cada usuario
        const promises = usuarios
            .filter(usuario => usuario.activo)
            .map(usuario => 
                notificacionesManager.crearNotificacion(
                    usuario.id,
                    tipo,
                    mensaje
                )
            );
        
        const results = await Promise.allSettled(promises);
        
        // Contar éxitos y fallos
        const exitosos = results.filter(r => r.status === 'fulfilled').length;
        const fallidos = results.filter(r => r.status === 'rejected').length;
        
        console.log(`Notificaciones enviadas: ${exitosos} exitosas, ${fallidos} fallidas`);
        
        return {
            total: usuarios.length,
            exitosos,
            fallidos
        };
    } catch (error) {
        console.error('Error al enviar notificaciones a todos los usuarios:', error);
        throw error;
    }
}

// Exponer la función helper
window.notificarTodosUsuarios = notificarTodosUsuarios;
