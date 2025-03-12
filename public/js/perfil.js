document.addEventListener('DOMContentLoaded', function() {
    // Cargar información del perfil para todos los usuarios
    cargarPerfil();

    // Verificar si es administrador y mostrar sección adicional
    const userType = getUserType();
    if (userType === 'ADMIN') {
        const adminSection = document.getElementById('admin-section');
        if (adminSection) {
            adminSection.style.display = 'block';
            cargarListaUsuarios();
        }
    }

    // Configurar event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Botón nuevo usuario
    document.getElementById('btn-nuevo-usuario')?.addEventListener('click', () => {
        document.getElementById('usuario-form').reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuarioModalLabel').textContent = 'Nuevo Usuario';
        const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
        modal.show();
    });

    // Botón guardar usuario
    document.getElementById('btn-guardar-usuario')?.addEventListener('click', guardarUsuario);
}

async function cargarPerfil() {
    try {
        const userInfo = getUserInfo();
        if (!userInfo) {
            throw new Error('No hay información de usuario disponible');
        }

        console.log('Datos del perfil:', userInfo);
        
        // Actualizar la información en la página
        document.getElementById('perfil-nombre-display').textContent = userInfo.nombre || '';
        document.getElementById('perfil-email').textContent = userInfo.email || '';
        document.getElementById('perfil-tipo').textContent = formatearRol(userInfo.tipo) || '';
        
        // También actualizar el header
        document.getElementById('usuario-actual').textContent = userInfo.nombre || '';
        document.getElementById('tipo-usuario-actual').textContent = formatearRol(userInfo.tipo) || '';
        
        // Si hay un formulario de edición, actualizar sus campos
        const nombreInput = document.getElementById('perfil-nombre');
        if (nombreInput) {
            nombreInput.value = userInfo.nombre || '';
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        mostrarAlerta('Error al cargar el perfil', 'danger');
    }
}

async function cargarListaUsuarios() {
    try {
        const response = await fetch('/api/usuarios', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar usuarios');

        const usuarios = await response.json();
        const tbody = document.getElementById('usuarios-table-body');
        tbody.innerHTML = usuarios.map(usuario => crearFilaUsuario(usuario)).join('');
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar usuarios', 'error');
    }
}

function crearFilaUsuario(usuario) {
    return `
        <tr>
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${usuario.tipo === 'ADMIN' ? 'Administrador' : 'Cliente'}</td>
            <td>
                <a href="#" class="text-edit" onclick="editarUsuario(${usuario.id})">
                    <i class="fas fa-edit"></i> Editar
                </a> | 
                <a href="#" class="text-delete" onclick="eliminarUsuario(${usuario.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </a>
            </td>
        </tr>
    `;
}

async function guardarUsuario() {
    try {
        const usuarioId = document.getElementById('usuario-id').value;
        const formData = {
            nombre: document.getElementById('usuario-nombre').value,
            email: document.getElementById('usuario-email').value,
            tipo: document.getElementById('usuario-tipo').value
        };

        const password = document.getElementById('usuario-password').value;
        if (password) formData.contrasena = password;

        if (formData.tipo === 'CLIENTE') {
            formData.cliente = {
                direccion: document.getElementById('usuario-direccion').value,
                telefono: document.getElementById('usuario-telefono').value
            };
        }

        const url = usuarioId ? `/api/usuarios/${usuarioId}` : '/api/usuarios';
        const method = usuarioId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al guardar usuario');

        mostrarAlerta('Usuario guardado exitosamente', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('usuarioModal'));
        modal.hide();
        cargarListaUsuarios();

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar usuario', 'error');
    }
}

async function editarUsuario(id) {
    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar usuario');

        const usuario = await response.json();
        document.getElementById('usuario-id').value = usuario.id;
        document.getElementById('usuario-email').value = usuario.email;
        document.getElementById('usuario-tipo').value = usuario.tipo;
        document.getElementById('usuario-password').value = '';
        document.getElementById('usuarioModalLabel').textContent = 'Editar Usuario';

        const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
        modal.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar usuario', 'error');
    }
}

async function eliminarUsuario(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar usuario');

        mostrarAlerta('Usuario eliminado correctamente', 'success');
        cargarListaUsuarios();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar usuario', 'error');
    }
}

function getUserType() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        return window.decodeJWT(token).tipo;
    } catch (error) {
        console.error('Error al obtener tipo de usuario:', error);
        return null;
    }
}

function getUserId() {
    return window.getUserId();
}

// Función para cargar el perfil del usuario
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el perfil');
        }

        const usuario = await response.json();
        displayUserProfile(usuario);
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar el perfil', 'danger');
    }
}

// Función para mostrar la información del perfil
function displayUserProfile(usuario) {
    document.getElementById('perfil-email').textContent = usuario.email;
    document.getElementById('perfil-tipo').textContent = formatearRol(usuario.tipo);
    
    // Actualizar el formulario de edición si existe
    const nombreInput = document.getElementById('perfil-nombre');
    if (nombreInput) {
        nombreInput.value = usuario.nombre;
    }
}

// Función para formatear el rol del usuario
function formatearRol(tipo) {
    const roles = {
        'ADMIN': 'Administrador',
        'CLIENTE': 'Cliente',
        'TRABAJADOR': 'Trabajador'
    };
    return roles[tipo] || tipo;
}

// Función para mostrar el modal de edición de perfil
function showEditProfileModal() {
    const modal = new bootstrap.Modal(document.getElementById('modalEditarPerfil'));
    modal.show();
}

// Función para guardar cambios del perfil
async function saveProfileChanges() {
    try {
        const token = localStorage.getItem('token');
        const userData = {
            nombre: document.getElementById('perfil-nombre').value,
            password: document.getElementById('perfil-password').value
        };

        const response = await fetch('/api/usuarios/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el perfil');
        }

        const usuario = await response.json();
        displayUserProfile(usuario);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarPerfil'));
        modal.hide();
        
        mostrarAlerta('Perfil actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al actualizar el perfil', 'danger');
    }
}

// Función para mostrar alertas
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', showEditProfileModal);
    }

    const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');
    if (btnGuardarPerfil) {
        btnGuardarPerfil.addEventListener('click', saveProfileChanges);
    }
});

// Exportar funciones necesarias
window.loadUserProfile = loadUserProfile; 