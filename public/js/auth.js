// Variables globales para el estado de autenticación
const auth = {
    token: null,
    usuario: null,
    initialized: false,
    
    // Método para obtener los encabezados de autenticación
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token || localStorage.getItem('token')}`
        };
    }
};

// Función para inicializar la autenticación
function initAuth() {
    if (auth.initialized) return;
    
    auth.token = localStorage.getItem('token');
    try {
        auth.usuario = JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
        auth.usuario = null;
    }
    auth.initialized = true;
}

// Función para verificar si estamos en la página de login
function isLoginPage() {
    const isLogin = window.location.pathname.endsWith('login.html');
    console.log('[Auth Debug] Verificando página de login:', {
        pathname: window.location.pathname,
        isLogin: isLogin
    });
    return isLogin;
}

// Función para decodificar el token de manera segura
function decodeToken(token) {
    try {
        // Dividir el token JWT en sus partes
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Token JWT inválido');
        }
        
        // Decodificar la parte del payload (segunda parte)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('Token decodificado exitosamente:', payload);
        return payload;
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
    }
}

// Función para verificar autenticación
async function verificarAutenticacion() {
    console.log('[Auth Debug] Iniciando verificación de autenticación:', {
        pathname: window.location.pathname,
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash
    });
    
    // Inicializar estado de autenticación
    initAuth();
    console.log('[Auth Debug] Estado de autenticación inicial:', {
        token: auth.token ? 'Presente' : 'No presente',
        usuario: auth.usuario,
        initialized: auth.initialized
    });

    const token = localStorage.getItem('token');
    if (!token) {
        console.log('[Auth Debug] No hay token disponible');
        if (!isLoginPage()) {
            console.log('[Auth Debug] Redirigiendo a login por falta de token');
            window.location.replace('/login.html');
        }
        return false;
    }

    try {
        console.log('[Auth Debug] Verificando token con el servidor');
        // Verificar el token con el servidor
        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log('[Auth Debug] Token inválido:', {
                status: response.status,
                statusText: response.statusText
            });
            throw new Error('Token inválido');
        }

        const userData = await response.json();
        console.log('[Auth Debug] Datos de usuario verificados:', userData);

        // Si estamos en la página de login y el token es válido, redirigir al dashboard
        if (isLoginPage()) {
            console.log('[Auth Debug] Token válido en página de login, redirigiendo a dashboard');
            window.location.replace('/index.html');
            return true;
        }

        // Verificar acceso a la página de administración de tienda
        if (window.location.pathname.includes('/admin/tienda.html')) {
            console.log('[Auth Debug] Verificando acceso a administración de tienda:', {
                userType: userData.tipo,
                isAdmin: userData.tipo === 'ADMIN'
            });
            if (userData.tipo !== 'ADMIN') {
                console.log('[Auth Debug] Usuario no autorizado para acceder a la administración de tienda');
                window.location.replace('/');
                return false;
            }
        }

        // Actualizar la UI con la información del usuario
        console.log('[Auth Debug] Actualizando UI con datos de usuario');
        actualizarInfoUsuario(userData);
        
        console.log('[Auth Debug] Verificación de autenticación exitosa');
        return true;
    } catch (error) {
        console.error('[Auth Debug] Error en verificación de autenticación:', error);
        if (!isLoginPage()) {
            console.log('[Auth Debug] Error detectado, ejecutando logout');
            logout();
        }
        return false;
    }
}

// Función para actualizar la UI con la información del usuario
function actualizarInfoUsuario(userData) {
    console.log('[Auth Debug] Iniciando actualización de UI:', userData);
    
    const usuarioActual = document.getElementById('usuario-actual');
    const tipoUsuario = document.getElementById('tipo-usuario-actual');
    
    console.log('[Auth Debug] Elementos encontrados:', {
        usuarioActual: usuarioActual ? 'Presente' : 'No encontrado',
        tipoUsuario: tipoUsuario ? 'Presente' : 'No encontrado'
    });

    if (usuarioActual) {
        usuarioActual.textContent = userData.nombre || userData.email;
    }
    if (tipoUsuario) {
        tipoUsuario.textContent = formatearRol(userData.tipo);
    }

    // Manejar elementos específicos de administrador
    const adminElements = document.querySelectorAll('.admin-only');
    console.log('[Auth Debug] Elementos admin encontrados:', {
        cantidad: adminElements.length,
        tipoUsuario: userData.tipo
    });
    
    adminElements.forEach((element, index) => {
        console.log(`[Auth Debug] Procesando elemento admin #${index}:`, {
            tagName: element.tagName,
            classes: element.className,
            isVisible: window.getComputedStyle(element).display !== 'none'
        });

        if (userData.tipo === 'ADMIN') {
            console.log(`[Auth Debug] Mostrando elemento admin #${index}`);
            element.style.display = 'block';
            element.classList.remove('d-none');
            
            // Si es un elemento del menú lateral, asegurarse de que sea visible
            if (element.closest('.sidebar')) {
                element.style.display = 'list-item';
            }
        } else {
            console.log(`[Auth Debug] Ocultando elemento admin #${index}`);
            element.style.display = 'none';
            element.classList.add('d-none');
        }
    });

    // Actualizar el estado global
    auth.usuario = userData;
    auth.initialized = true;
    console.log('[Auth Debug] Estado global actualizado:', {
        usuario: auth.usuario,
        initialized: auth.initialized
    });

    // Guardar en localStorage para persistencia
    localStorage.setItem('usuario', JSON.stringify(userData));
    console.log('[Auth Debug] Datos guardados en localStorage');
}

// Función para formatear el rol
function formatearRol(tipo) {
    const roles = {
        'ADMIN': 'Administrador',
        'CLIENTE': 'Cliente',
        'TRABAJADOR': 'Trabajador'
    };
    return roles[tipo] || tipo;
}

// Función de login
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el inicio de sesión');
        }

        console.log('Respuesta del servidor:', data);

        // Guardar datos de autenticación
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        // Actualizar estado global
        auth.token = data.token;
        auth.usuario = data.usuario;
        auth.initialized = true;

        console.log('Login exitoso, datos guardados correctamente');
        
        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 100);

    } catch (error) {
        console.error('Error en login:', error);
        mostrarError(error.message || 'Error al iniciar sesión');
    }
}

// Función de logout
function logout() {
    // Limpiar estado global
    auth.token = null;
    auth.usuario = null;
    auth.initialized = false;

    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    // Redirigir al login
    window.location.href = '/login.html';
}

// Función para mostrar errores
function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    }
}

// Event listener para cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo verificar autenticación si no estamos en la página de login
    if (!isLoginPage()) {
        verificarAutenticacion();
    }

    // Configurar el botón de logout si existe
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
});

// Función para obtener información del usuario actual
function getUserInfo() {
    try {
        return JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
        console.error('[Auth Debug] Error al obtener información del usuario:', e);
        return null;
    }
}

// Función para verificar si el usuario es administrador
function isAdmin() {
    const user = getUserInfo();
    return user && user.tipo === 'ADMIN';
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Exponer funciones globalmente
window.auth = auth;
window.initAuth = initAuth;
window.verificarAutenticacion = verificarAutenticacion;
window.getUserInfo = getUserInfo;
window.isAdmin = isAdmin;
window.isAuthenticated = isAuthenticated;
