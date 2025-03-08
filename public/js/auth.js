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

function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    // Aquí puedes agregar la lógica para verificar el token con el backend
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
                login(email, password);
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

async function login(email, password) {
    try {
        const response = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Error en el inicio de sesión');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.location.href = '/';
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error en el inicio de sesión', 'error');
    }
}

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
