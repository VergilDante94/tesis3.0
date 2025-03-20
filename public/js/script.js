// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicación...');
    
    // Inicializar los iconos de Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
        console.log('Feather icons inicializados');
    } else {
        console.warn('Feather icons no disponible');
    }
    
    await initializeAuth();
});

// Inicialización de autenticación
async function initializeAuth() {
    console.log('Verificando autenticación inicial...');
    try {
        if (!verificarAutenticacion()) {
            console.log('Verificación de autenticación falló');
            return;
        }

        const token = localStorage.getItem('token');
        console.log('Token encontrado:', token ? 'Sí' : 'No');
        
        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Error en respuesta de /api/usuarios/me:', response.status);
            throw new Error('Token inválido');
        }

        const userData = await response.json();
        console.log('Datos de usuario cargados:', userData);
        
        actualizarInfoUsuario(userData);
        await verificarPermisos();
        setupNavigation();
        showSection('datos');
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// Configuración de navegación
function setupNavigation() {
    const sidebarLinks = document.querySelectorAll('.nav-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });
}

// Función para mostrar secciones
function showSection(sectionId) {
    console.log('Mostrando sección:', sectionId);
    
    if (!verificarAutenticacion()) {
        return;
    }

    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        
        verificarPermisos();
        cargarDatosSeccion(sectionId);
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

// Cargar datos específicos de cada sección
function cargarDatosSeccion(sectionId) {
    switch(sectionId) {
        case 'usuarios':
            if (typeof loadUsers === 'function') loadUsers();
            break;
        case 'ordenes':
            if (typeof loadServicesForOrders === 'function') loadServicesForOrders();
            break;
        case 'servicios':
            if (typeof loadServices === 'function') loadServices();
            break;
        case 'facturas':
            if (typeof loadInvoices === 'function') loadInvoices();
            break;
        case 'notificaciones':
            if (typeof loadNotifications === 'function') loadNotifications();
            break;
        case 'perfil':
            if (typeof loadUserProfile === 'function') loadUserProfile();
            break;
    }
}

// Función para verificar permisos
function verificarPermisos() {
    try {
        const userInfo = window.getUserInfo();
        console.log('Verificando permisos para usuario:', userInfo);

        if (!userInfo) {
            console.error('No se pudo obtener la información del usuario');
            return false;
        }

        const isAdmin = userInfo.tipo === 'ADMIN';
        console.log('¿Usuario es admin?:', isAdmin);

        // Mostrar/ocultar elementos de administrador
        const adminElements = document.querySelectorAll('.admin-only');
        console.log('Elementos admin encontrados:', adminElements.length);
        
        adminElements.forEach((element, index) => {
            console.log(`Elemento admin ${index}:`, element);
            if (isAdmin) {
                element.style.display = element.tagName === 'LI' ? 'list-item' : 'block';
                element.classList.remove('d-none');
                console.log(`Mostrando elemento admin ${index}:`, element.style.display);
            } else {
                element.style.display = 'none';
                element.classList.add('d-none');
                console.log(`Ocultando elemento admin ${index}`);
            }
        });

        // Mostrar/ocultar enlace de Gestión de Usuarios
        const gestionUsuariosLink = document.querySelector('a[data-section="usuarios"]');
        console.log('Enlace Gestión Usuarios:', gestionUsuariosLink);
        
        if (gestionUsuariosLink) {
            const parentElement = gestionUsuariosLink.parentElement;
            console.log('Elemento padre del enlace:', parentElement);
            
            if (isAdmin) {
                parentElement.style.display = 'list-item';
                parentElement.classList.remove('d-none');
                console.log('Enlace Gestión Usuarios mostrado con display:', parentElement.style.display);
            } else {
                parentElement.style.display = 'none';
                parentElement.classList.add('d-none');
                console.log('Enlace Gestión Usuarios ocultado');
            }
        } else {
            console.error('No se encontró el enlace de Gestión Usuarios');
        }

        return true;
    } catch (error) {
        console.error('Error al verificar permisos:', error);
        return false;
    }
}

// Función para actualizar información del usuario
function actualizarInfoUsuario(userInfo) {
    try {
        if (!userInfo) {
            console.error('No se pudo obtener la información del usuario');
            return;
        }

        const usuarioActual = document.getElementById('usuario-actual');
        const tipoUsuarioActual = document.getElementById('tipo-usuario-actual');

        if (usuarioActual) usuarioActual.textContent = userInfo.nombre || 'Usuario';
        if (tipoUsuarioActual) tipoUsuarioActual.textContent = userInfo.tipo || 'Sin rol';

        verificarPermisos();
    } catch (error) {
        console.error('Error al actualizar información del usuario:', error);
    }
}

// Función para verificar autenticación
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    const userInfo = getUserInfo();
    if (!userInfo) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return false;
    }

    return true;
}

// Exponer funciones necesarias globalmente
window.showSection = showSection;
window.verificarAutenticacion = verificarAutenticacion;
window.actualizarInfoUsuario = actualizarInfoUsuario;
window.verificarPermisos = verificarPermisos;

// Función para capturar errores del servidor en la consola
(function() {
    // Variable global para almacenar el último error del servidor
    window.lastServerError = '';
    
    // Sobrescribir console.error para capturar errores relevantes
    const originalConsoleError = console.error;
    console.error = function(...args) {
        // Llamar a la función original
        originalConsoleError.apply(console, args);
        
        // Capturar mensajes de error relacionados con restricciones de clave foránea
        const errorStr = args.join(' ');
        if (errorStr.includes('Foreign key constraint') || 
            errorStr.includes('P2003') || 
            errorStr.includes('constraint violated')) {
            window.lastServerError = errorStr;
        }
    };
})();