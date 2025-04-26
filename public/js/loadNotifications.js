// Función para cargar la sección de notificaciones (para el sistema de navegación)
function loadNotifications() {
    console.log('Cargando sección de notificaciones...');
    
    // Verificar si el contenedor existe
    const container = document.getElementById('notificacionesDatos');
    if (!container) {
        console.error('El contenedor de notificaciones no existe en el DOM');
        return;
    }
    
    // Mostrar indicador de carga
    container.innerHTML = `
        <div class="d-flex justify-content-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando notificaciones...</span>
            </div>
        </div>
    `;
    
    // Añadir depuración para ver el estado exacto del auth
    console.log('Estado de autenticación:', {
        auth: typeof auth,
        authInitialized: auth && auth.initialized,
        usuario: auth && auth.usuario,
        tokenEnAuth: auth && auth.token,
        tokenEnLocalStorage: localStorage.getItem('token'),
        usuarioEnLocalStorage: localStorage.getItem('usuario')
    });
    
    // Intentar recuperar el usuario desde localStorage si auth no está inicializado correctamente
    if (!auth || !auth.usuario) {
        console.warn('Usuario no disponible en objeto auth, intentando recuperar desde localStorage');
        try {
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            if (usuarioGuardado && usuarioGuardado.id) {
                console.log('Usuario recuperado desde localStorage:', usuarioGuardado);
                // Actualizar auth si es posible
                if (auth) {
                    auth.usuario = usuarioGuardado;
                    auth.initialized = true;
                    auth.token = localStorage.getItem('token');
                    console.log('Objeto auth actualizado con datos de localStorage');
                }
            } else {
                console.warn('No hay datos de usuario válidos en localStorage');
            }
        } catch (e) {
            console.error('Error al parsear usuario desde localStorage:', e);
        }
    }
    
    // Verificar autenticación de manera segura
    const estaAutenticado = auth && (typeof auth.estaAutenticado === 'function' ? 
        auth.estaAutenticado() : !!localStorage.getItem('token'));
    
    // Verificar si auth y usuario existen después del intento de recuperación
    if (!auth || !auth.usuario || !estaAutenticado) {
        console.warn('Usuario no autenticado o no inicializado completamente, no se pueden cargar notificaciones');
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3>Notificaciones</h3>
            </div>
            <div class="alert alert-warning">
                Debes iniciar sesión correctamente para ver tus notificaciones
            </div>
        `;
        return;
    }
    
    if (typeof actualizarNotificaciones !== 'function') {
        console.error('Función actualizarNotificaciones no encontrada');
        container.innerHTML = `
            <div class="alert alert-danger">
                Error en el sistema de notificaciones. La función actualizarNotificaciones no está disponible.
            </div>
        `;
        return;
    }
    
    // Actualizar notificaciones
    actualizarNotificaciones();
}

// Exponer función en el objeto window
window.loadNotifications = loadNotifications; 