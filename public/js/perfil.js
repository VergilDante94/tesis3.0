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

    // Botón editar perfil
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    if (btnEditarPerfil) {
        console.log('Botón editar perfil encontrado, configurando event listener');
        btnEditarPerfil.addEventListener('click', showEditProfileModal);
    } else {
        console.warn('Botón editar perfil no encontrado');
    }

    // Botón guardar perfil
    const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');
    if (btnGuardarPerfil) {
        console.log('Botón guardar perfil encontrado, configurando event listener');
        btnGuardarPerfil.addEventListener('click', saveProfileChanges);
    } else {
        console.warn('Botón guardar perfil no encontrado');
    }
}

async function cargarPerfil() {
    try {
        // Intentar obtener los datos del usuario directamente del localStorage
        let userInfo = null;
        const usuarioJSON = localStorage.getItem('usuario');
        
        if (usuarioJSON) {
            userInfo = JSON.parse(usuarioJSON);
            console.log('Datos del usuario desde localStorage:', userInfo);
        } else {
            // Si no hay datos en localStorage, intentar obtenerlos del token
            userInfo = getUserInfo();
            console.log('Datos del usuario desde token:', userInfo);
        }
        
        if (!userInfo) {
            throw new Error('No hay información de usuario disponible');
        }

        console.log('Datos del perfil:', userInfo);
        
        // Actualizar la información en la página
        document.getElementById('perfil-nombre-display').textContent = userInfo.nombre || '';
        document.getElementById('perfil-email').textContent = userInfo.email || '';
        document.getElementById('perfil-tipo').textContent = formatearRol(userInfo.tipo || userInfo.rol) || '';
        document.getElementById('perfil-direccion').textContent = userInfo.direccion || 'No especificada';
        document.getElementById('perfil-telefono').textContent = userInfo.telefono || 'No especificado';
        
        // También actualizar el header
        document.getElementById('usuario-actual').textContent = userInfo.nombre || '';
        document.getElementById('tipo-usuario-actual').textContent = formatearRol(userInfo.tipo || userInfo.rol) || '';
        
        // Si hay un formulario de edición, actualizar sus campos
        const nombreInput = document.getElementById('perfil-nombre');
        if (nombreInput) {
            nombreInput.value = userInfo.nombre || '';
        }
        
        // Mostrar el botón de edición solo para administradores
        const btnEditarPerfil = document.getElementById('btn-editar-perfil');
        if (btnEditarPerfil) {
            const userType = userInfo.tipo || userInfo.rol;
            if (userType === 'ADMIN') {
                btnEditarPerfil.style.display = 'inline-block';
            } else {
                btnEditarPerfil.style.display = 'none';
            }
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
            formData.cliente = {};
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
        document.getElementById('usuario-nombre').value = usuario.nombre || '';
        document.getElementById('usuario-email').value = usuario.email || '';
        document.getElementById('usuario-tipo').value = usuario.tipo || '';
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
    // Actualizar campos de entrada si existen
    const nombreInput = document.getElementById('perfil-nombre');
    if (nombreInput) {
        nombreInput.value = usuario.nombre || '';
    }
    
    const emailInput = document.getElementById('perfil-email');
    if (emailInput) {
        emailInput.value = usuario.email || '';
    }
    
    // Mostrar información en el modo visualización si existen los elementos
    const nombreText = document.getElementById('perfil-nombre-text');
    if (nombreText) {
        nombreText.textContent = usuario.nombre || '';
    }
    
    const emailText = document.getElementById('perfil-email-text');
    if (emailText) {
        emailText.textContent = usuario.email || '';
    }
    
    // Para dirección y teléfono
    const direccionElement = document.getElementById('perfil-direccion-text');
    if (direccionElement) {
        direccionElement.textContent = (usuario.direccion) ? usuario.direccion : 'No especificada';
    }
    
    const telefonoElement = document.getElementById('perfil-telefono-text');
    if (telefonoElement) {
        telefonoElement.textContent = (usuario.telefono) ? usuario.telefono : 'No especificado';
    }
    
    // Actualizar campos de entrada adicionales
    const direccionInput = document.getElementById('perfil-direccion');
    if (direccionInput) {
        direccionInput.value = usuario.direccion || '';
    }
    
    const telefonoInput = document.getElementById('perfil-telefono');
    if (telefonoInput) {
        telefonoInput.value = usuario.telefono || '';
    }
    
    // Limpiar el campo de contraseña si existe
    const passwordInput = document.getElementById('perfil-password');
    if (passwordInput) {
        passwordInput.value = '';
    }
    
    // Mostrar la vista de perfil y ocultar formulario si existen
    const perfilView = document.getElementById('perfil-view');
    if (perfilView) {
        perfilView.classList.remove('d-none');
    }
    
    const perfilForm = document.getElementById('perfil-form');
    if (perfilForm) {
        perfilForm.classList.add('d-none');
    }
    
    console.log('Perfil actualizado correctamente:', usuario);
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
    // Verificar si el usuario es administrador
    const userType = getUserType();
    if (userType !== 'ADMIN') {
        mostrarAlerta('Solo los administradores pueden editar perfiles', 'danger');
        return;
    }
    
    // Obtener los datos actuales del usuario
    const userInfo = JSON.parse(localStorage.getItem('usuario'));
    console.log('Datos actuales del usuario para edición:', userInfo);
    
    // Llenar el formulario con los datos actuales
    const nombreInput = document.getElementById('perfil-nombre');
    if (nombreInput) {
        nombreInput.value = userInfo.nombre || '';
    }
    
    // Asegurarse de cargar los valores existentes de dirección y teléfono
    const direccionInput = document.getElementById('perfil-direccion');
    if (direccionInput) {
        direccionInput.value = userInfo.direccion || '';
        console.log('Campo dirección cargado con:', direccionInput.value);
    } else {
        console.warn('Campo de dirección no encontrado en el DOM');
    }
    
    const telefonoInput = document.getElementById('perfil-telefono');
    if (telefonoInput) {
        telefonoInput.value = userInfo.telefono || '';
        console.log('Campo teléfono cargado con:', telefonoInput.value);
    } else {
        console.warn('Campo de teléfono no encontrado en el DOM');
    }
    
    // Limpiar el campo de contraseña
    const passwordInput = document.getElementById('perfil-password');
    if (passwordInput) {
        passwordInput.value = '';
    }
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarPerfil'));
    modal.show();
}

// Función para guardar cambios del perfil
async function saveProfileChanges() {
    try {
        // Verificar si el usuario es administrador
        const userType = getUserType();
        if (userType !== 'ADMIN') {
            mostrarAlerta('No tienes permiso para realizar esta acción', 'danger');
            return;
        }
        
        // Obtener DIRECTAMENTE los valores del formulario sin comprobaciones previas
        const nombre = document.getElementById('perfil-nombre').value.trim();
        const direccion = document.getElementById('perfil-direccion').value.trim();
        const telefono = document.getElementById('perfil-telefono').value.trim();
        const password = document.getElementById('perfil-password').value.trim();
        
        console.log('== VALORES DEL FORMULARIO ==');
        console.log('Nombre:', nombre);
        console.log('Dirección:', direccion);
        console.log('Teléfono:', telefono);
        console.log('Password presente:', password ? 'Sí' : 'No');
        
        // Crear el objeto con los datos a enviar - asegurando que cada campo tiene un valor
        const userData = {
            nombre: nombre || 'Administrador',  // Valor por defecto si está vacío
            direccion: direccion || '',
            telefono: telefono || ''
        };
        
        // Si hay contraseña, incluirla
        if (password) {
            userData.password = password;
        }
        
        console.log('Enviando datos al servidor:', JSON.stringify(userData));
        
        // Enviar la solicitud con un timeout más largo
        const token = localStorage.getItem('token');
        const response = await fetch('/api/usuarios/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        // Verificar la respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Respuesta de error completa:', errorText);
            throw new Error(`Error al actualizar el perfil: ${response.status} ${response.statusText}`);
        }
        
        // Procesar la respuesta exitosa
        const updatedUser = await response.json();
        console.log('Respuesta del servidor:', updatedUser);
        
        // Actualizar datos en localStorage
        const userInfo = JSON.parse(localStorage.getItem('usuario'));
        userInfo.nombre = updatedUser.nombre;
        userInfo.direccion = updatedUser.direccion;
        userInfo.telefono = updatedUser.telefono;
        localStorage.setItem('usuario', JSON.stringify(userInfo));
        
        // Cerrar el modal y actualizar la UI
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarPerfil'));
        modal.hide();
        
        mostrarAlerta('Perfil actualizado correctamente', 'success');
        
        // Recargar la página para refrescar los datos
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarAlerta(`Error al actualizar el perfil: ${error.message}`, 'danger');
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

// Exportar funciones necesarias
window.loadUserProfile = loadUserProfile;