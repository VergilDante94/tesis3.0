const auth = {
    token: null,
    usuario: null,

    async login(email, contrasena) {
        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, contrasena })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.usuario = data.usuario;
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                actualizarInfoUsuario();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    },

    logout() {
        this.token = null;
        this.usuario = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login.html';
    },

    isAuthenticated() {
        return !!this.token;
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }
};

// Cargar token si existe
auth.token = localStorage.getItem('token');
auth.usuario = JSON.parse(localStorage.getItem('usuario'));

// Función para verificar si estamos en la página de login
function isLoginPage() {
    return window.location.pathname.includes('login.html');
}

// Función para verificar autenticación
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    const esLoginPage = window.location.pathname.includes('login.html');

    if (!token && !esLoginPage) {
        window.location.href = '/login.html';
        return false;
    }

    if (token && esLoginPage) {
        window.location.href = '/index.html';
        return false;
    }

    return true;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

function actualizarInfoUsuario() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload); // Para depuración
            
            const usuarioActual = document.getElementById('usuario-actual');
            const tipoUsuarioActual = document.getElementById('tipo-usuario-actual');
            
            if (usuarioActual && tipoUsuarioActual) {
                usuarioActual.textContent = payload.nombre || 'Usuario';
                tipoUsuarioActual.textContent = payload.tipo || 'Sin tipo';
            } else {
                console.error('Elementos de usuario no encontrados en el DOM');
            }
        } catch (error) {
            console.error('Error al decodificar el token:', error);
            // Si hay error, redirigir al login
            window.location.href = '/login.html';
        }
    } else {
        console.log('No hay token almacenado');
        // Si no hay token, redirigir al login
        window.location.href = '/login.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Obtener la página actual
    const currentPage = window.location.pathname;
    
    // Si estamos en la página de login, no verificamos el token
    if (currentPage === '/login.html') {
        // Solo configuramos el evento de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                login(e);
            });
        }
        return; // Salimos de la función para evitar otras verificaciones
    }

    // Para otras páginas, verificamos el token
    const token = localStorage.getItem('token');
    if (!token && currentPage !== '/login.html') {
        window.location.href = '/login.html';
        return;
    }

    // Actualizar información del usuario si no estamos en login
    actualizarInfoUsuario();

    // Configurar el botón de logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Función para cargar la información del usuario
async function cargarInformacionUsuario() {
    // Solo cargar información si no estamos en la página de login
    if (isLoginPage()) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener información del usuario');
        }

        const usuario = await response.json();
        
        // Actualizar elementos solo si existen
        const nombreElement = document.getElementById('usuario-actual');
        const tipoElement = document.getElementById('tipo-usuario-actual');
        
        if (nombreElement) nombreElement.textContent = usuario.nombre;
        if (tipoElement) tipoElement.textContent = usuario.tipo;

        // Manejar elementos admin-only
        if (usuario.tipo !== 'ADMIN') {
            document.querySelectorAll('.admin-only').forEach(element => {
                element.style.display = 'none';
            });
        }

    } catch (error) {
        console.error('Error:', error);
        // No redirigir automáticamente en caso de error
    }
}

// Event listener para cuando el documento está listo
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
});

// Función de login
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log('Intentando login con:', { email }); // Debug

        const response = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Respuesta del servidor:', response.status); // Debug

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Credenciales inválidas');
            }
            throw new Error('Error en el servidor');
        }

        const data = await response.json();
        console.log('Login exitoso:', data); // Debug

        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/index.html';
        } else {
            throw new Error('No se recibió el token');
        }

    } catch (error) {
        console.error('Error en login:', error);
        // Mostrar mensaje de error al usuario de forma más amigable
        let mensajeError = 'Error al iniciar sesión';
        if (error.message === 'Credenciales inválidas') {
            mensajeError = 'El correo o la contraseña son incorrectos';
        }
        mostrarError(mensajeError);
    }
}

// Función para mostrar errores de forma más visible
function mostrarError(mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <strong>Error:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insertar el mensaje al principio del formulario
    const form = document.querySelector('.login-form');
    form.insertBefore(alertDiv, form.firstChild);

    // Remover el mensaje después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Función de logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

function mostrarAlerta(mensaje, tipo) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertaDiv.role = 'alert';
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar la alerta al principio del contenedor principal
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertaDiv, container.firstChild);

    // Remover la alerta después de 3 segundos
    setTimeout(() => {
        alertaDiv.remove();
    }, 3000);
}

// Función para decodificar el token JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error al parsear token:', e);
        return null;
    }
}

// Exportar funciones necesarias
window.login = login;
window.logout = logout;
