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
let usuarioActual = null;
let modalUsuario = null;

// Función para cargar usuarios
async function loadUsers() {
    try {
        console.log('Iniciando carga de usuarios...'); // Debug
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No hay token disponible');
            return;
        }

        const response = await fetch('/api/usuarios', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const usuarios = await response.json();
        console.log('Datos de usuarios recibidos:', usuarios); // Debug

        // Verificar si la sección está visible
        const seccionUsuarios = document.getElementById('usuarios');
        if (seccionUsuarios) {
            console.log('Estado de visualización de la sección:', seccionUsuarios.style.display); // Debug
            seccionUsuarios.style.display = 'block';
        }

        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarAlerta('Error al cargar usuarios', 'danger');
    }
}

// Función para mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;

    tbody.innerHTML = '';
    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${formatearRol(usuario.tipo)}</td>
            <td>
                <a href="#" class="text-info" onclick="editarUsuario(${usuario.id}); return false;">Editar</a>
                <a href="#" class="text-danger" onclick="eliminarUsuario(${usuario.id}); return false;">Eliminar</a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Hacer la función loadUsers disponible globalmente
window.loadUsers = loadUsers;

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
    if (form) {
        form.reset();
    }
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
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al obtener usuario');

        const user = await response.json();
        editingUserId = user.id;
        
        document.getElementById('userName').value = user.nombre || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userType').value = user.tipo || 'CLIENTE';
        
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
        if (modal) {
            modal.hide();
        }
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

// Asegurarse de que la sección de usuarios sea visible
function showUsersSection() {
    const usuariosSection = document.getElementById('usuarios');
    if (usuariosSection) {
        // Ocultar otras secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        // Mostrar sección de usuarios
        usuariosSection.style.display = 'block';
        // Cargar usuarios
        loadUsers();
    }
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

// Función para mostrar el modal de crear
function mostrarModalCrear() {
    usuarioActual = null;
    const form = document.getElementById('formUsuario');
    if (form) {
        form.reset();
    }
    const modalTitle = document.querySelector('#modalUsuario .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Crear Usuario';
    }
    modalUsuario.show();
}

// Función para editar usuario
async function editarUsuario(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener usuario');
        }

        const usuario = await response.json();
        usuarioActual = usuario;

        document.getElementById('nombre').value = usuario.nombre || '';
        document.getElementById('email').value = usuario.email || '';
        document.getElementById('tipo').value = usuario.tipo || 'CLIENTE';

        const modalTitle = document.querySelector('#modalUsuario .modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Usuario';
        }
        modalUsuario.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar usuario', 'danger');
    }
}

// Función para guardar usuario
async function guardarUsuario() {
    try {
        const token = localStorage.getItem('token');
        const userData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            tipo: document.getElementById('tipo').value
        };

        const url = usuarioActual ? `/api/usuarios/${usuarioActual.id}` : '/api/usuarios';
        const method = usuarioActual ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Error al guardar usuario');
        }

        modalUsuario.hide();
        loadUsers();
        mostrarAlerta('Usuario guardado exitosamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar usuario', 'danger');
    }
}

// Función para eliminar usuario
async function eliminarUsuario(id) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar usuario');
        }

        loadUsers();
        mostrarAlerta('Usuario eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar usuario', 'danger');
    }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    // Remover alertas existentes
    const alertasExistentes = document.querySelectorAll('.alert');
    alertasExistentes.forEach(alerta => alerta.remove());

    // Crear nueva alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Agregar la alerta al body
    document.body.appendChild(alertDiv);

    // Remover la alerta después de 3 segundos
    setTimeout(() => {
        if (alertDiv && document.body.contains(alertDiv)) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 3000);
}

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de usuarios...'); // Debug
    
    // Inicializar el modal
    const modalElement = document.getElementById('modalUsuario');
    if (modalElement) {
        modalUsuario = new bootstrap.Modal(modalElement);
        console.log('Modal inicializado'); // Debug
    }
    
    // Event listeners
    const btnCrear = document.getElementById('btnCrearUsuario');
    if (btnCrear) {
        btnCrear.addEventListener('click', mostrarModalCrear);
        console.log('Botón crear usuario inicializado'); // Debug
    }
    
    const btnGuardar = document.getElementById('btnGuardarUsuario');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarUsuario);
        console.log('Botón guardar usuario inicializado'); // Debug
    }
    
    // Cargar usuarios si la sección está visible
    const seccionUsuarios = document.getElementById('usuarios');
    if (seccionUsuarios && window.getComputedStyle(seccionUsuarios).display !== 'none') {
        loadUsers();
    }
});

// Actualiza la función showSection en script.js
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Cargar datos específicos de la sección
        if (sectionId === 'usuarios') {
            loadUsers(); // Aquí llamamos a loadUsers
        }
    }

    // Actualizar enlace activo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
} 