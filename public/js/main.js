// Inicializar sistema de notificaciones
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    verificarAutenticacion().then(() => {
        // Iniciar el sistema de notificaciones si el usuario está autenticado
        if (auth.estaAutenticado()) {
            console.log('Sistema de notificaciones iniciado');
        }
    });
    
    // Limpiar el intervalo de notificaciones al cerrar o recargar la página
    window.addEventListener('beforeunload', function() {
        // detenerNotificaciones();
    });
}); 