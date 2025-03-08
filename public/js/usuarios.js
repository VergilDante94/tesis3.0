document.addEventListener('DOMContentLoaded', function() {
    if (getUserType() === 'ADMIN') {
        setupUsuariosEventListeners();
    }
});

function setupUsuariosEventListeners() {
    document.getElementById('btn-nuevo-usuario')?.addEventListener('click', () => {
        document.getElementById('usuario-form').reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuarioModalLabel').textContent = 'Nuevo Usuario';
        const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
        modal.show();
    });
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
        tbody.innerHTML = usuarios.map(usuario => `
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
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar usuarios', 'error');
    }
}

// Variables globales
let editingUserId = null;

// Función para cargar usuarios
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/usuarios', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }

        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para mostrar usuarios en la tabla
function displayUsers(users) {
    const tbody = document.getElementById('usersList');
    if (!tbody) return;

    tbody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.nombre}</td>
            <td>${user.email}</td>
            <td>${formatUserType(user.tipo)}</td>
            <td>
                <a href="#" class="text-info" onclick="editUser(${user.id})">Editar</a> | 
                <a href="#" class="text-danger" onclick="confirmDelete(${user.id})">Eliminar</a>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Función para formatear el tipo de usuario
function formatUserType(tipo) {
    const tipos = {
        'ADMIN': 'Administrador',
        'CLIENTE': 'Cliente',
        'TRABAJADOR': 'Trabajador'
    };
    return tipos[tipo] || tipo;
}

// Función para mostrar el modal de creación
function showCreateModal() {
    editingUserId = null;
    const form = document.getElementById('userForm');
    form.reset();
    document.getElementById('userModalLabel').textContent = 'Crear Usuario';
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

// Función para editar usuario
async function editUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al obtener usuario');

        const user = await response.json();
        editingUserId = user.id;
        
        document.getElementById('userName').value = user.nombre;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userType').value = user.tipo;
        
        document.getElementById('userModalLabel').textContent = 'Editar Usuario';
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para guardar usuario
async function saveUser() {
    const userData = {
        nombre: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        tipo: document.getElementById('userType').value
    };

    try {
        const token = localStorage.getItem('token');
        const url = editingUserId ? `/api/usuarios/${editingUserId}` : '/api/usuarios';
        const method = editingUserId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Error al guardar usuario');

        const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        modal.hide();
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para confirmar eliminación
function confirmDelete(userId) {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
        deleteUser(userId);
    }
}

// Función para eliminar usuario
async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar usuario');
        
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

// Mostrar alertas
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
} 