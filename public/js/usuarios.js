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

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de usuarios...');
    
    // Inicializar el modal
    modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
    console.log('Modal inicializado');

    // Configurar eventos
    const btnCrearUsuario = document.getElementById('btnCrearUsuario');
    if (btnCrearUsuario) {
        btnCrearUsuario.addEventListener('click', () => {
            usuarioActual = null;
            document.getElementById('formUsuario').reset();
            document.querySelector('#modalUsuario .modal-title').textContent = 'Crear Usuario';
            modalUsuario.show();
        });
        console.log('Botón crear usuario inicializado');
    }

    const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
    if (btnGuardarUsuario) {
        btnGuardarUsuario.addEventListener('click', guardarUsuario);
        console.log('Botón guardar usuario inicializado');
    }

    // Cargar usuarios si estamos en la sección correspondiente
    if (document.getElementById('usuarios').style.display !== 'none') {
        loadUsers();
    } else {
        console.log('La tabla de usuarios no está visible actualmente');
    }
});

// Función para cargar usuarios
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            console.error('Usuario no autorizado');
            mostrarAlerta('No tienes permisos para ver usuarios', 'error');
            return;
        }

        const tbody = document.getElementById('tablaUsuarios');
        if (!tbody) {
            console.error('No se encontró la tabla de usuarios');
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
        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarAlerta('Error al cargar usuarios', 'error');
    }
}

// Función para mostrar usuarios
function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) {
        console.error('No se encontró la tabla de usuarios');
        return;
    }

    tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${formatearTipoUsuario(usuario.tipo)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarUsuario(${usuario.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${usuario.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para formatear el tipo de usuario
function formatearTipoUsuario(tipo) {
    const tipos = {
        'ADMIN': 'Administrador',
        'CLIENTE': 'Cliente',
        'TRABAJADOR': 'Trabajador'
    };
    return tipos[tipo] || tipo;
}

// Función para editar usuario
async function editarUsuario(id) {
    try {
        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para editar usuarios', 'error');
            return;
        }

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

        document.getElementById('usuario-nombre').value = usuario.nombre || '';
        document.getElementById('usuario-email').value = usuario.email || '';
        document.getElementById('usuario-tipo').value = usuario.tipo || 'CLIENTE';
        document.getElementById('usuario-password').value = '';

        document.querySelector('#modalUsuario .modal-title').textContent = 'Editar Usuario';
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
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para guardar usuarios', 'error');
            return;
        }

        const formData = {
            nombre: document.getElementById('usuario-nombre').value,
            email: document.getElementById('usuario-email').value,
            tipo: document.getElementById('usuario-tipo').value
        };

        const password = document.getElementById('usuario-password').value;
        if (password) {
            formData.password = password;
        }

        const url = usuarioActual ? `/api/usuarios/${usuarioActual.id}` : '/api/usuarios';
        const method = usuarioActual ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
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
    try {
        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para eliminar usuarios', 'error');
            return;
        }

        if (!confirm('¿Está seguro de eliminar este usuario?')) {
            return;
        }

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

// Exponer funciones necesarias globalmente
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.loadUsers = loadUsers;

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