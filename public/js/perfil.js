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
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        document.getElementById('perfil-email').textContent = payload.email || '';
        document.getElementById('perfil-tipo').textContent = payload.tipo || '';
    } catch (error) {
        console.error('Error al cargar perfil:', error);
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
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tipo;
    } catch (error) {
        console.error('Error al decodificar el token:', error);
        return null;
    }
}

function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch (error) {
        console.error('Error al decodificar el token:', error);
        return null;
    }
} 