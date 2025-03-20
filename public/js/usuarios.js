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
    
    // Verificar estructura del DOM antes de inicializar
    const modalElement = document.getElementById('modalUsuario');
    if (!modalElement) {
        console.error('Error: No se encontró el elemento modalUsuario en el DOM');
        console.log('Elementos modales disponibles:');
        document.querySelectorAll('.modal').forEach(modal => {
            console.log(`- Modal ID: ${modal.id || 'sin-id'}`);
        });
        return;
    }
    
    try {
        // Inicializar el modal
        modalUsuario = new bootstrap.Modal(modalElement);
        console.log('Modal inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar el modal:', error);
        // Intentar alternativa si falla la inicialización
        try {
            console.log('Intentando inicialización alternativa del modal...');
            modalUsuario = new bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            console.log('Modal inicializado con configuración alternativa');
        } catch (fallbackError) {
            console.error('Error en inicialización alternativa:', fallbackError);
        }
    }
    
    // Configurar botón de crear usuario
    const btnCrearUsuario = document.getElementById('btnCrearUsuario');
    if (btnCrearUsuario) {
        btnCrearUsuario.addEventListener('click', mostrarModalCrearUsuario);
        console.log('Botón crear usuario inicializado');
    } else {
        console.error('No se encontró el botón de crear usuario');
    }

    const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
    if (btnGuardarUsuario) {
        btnGuardarUsuario.addEventListener('click', guardarUsuario);
        console.log('Botón guardar usuario inicializado');
    } else {
        console.error('No se encontró el botón de guardar usuario');
    }

    // Cargar usuarios si estamos en la sección correspondiente
    const seccionUsuarios = document.getElementById('usuarios');
    if (seccionUsuarios && seccionUsuarios.style.display !== 'none') {
        console.log('Cargando lista de usuarios...');
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

        const mostrarInactivos = document.getElementById('mostrar-inactivos')?.checked || false;
        
        const url = mostrarInactivos 
            ? '/api/usuarios?mostrarInactivos=true'
            : '/api/usuarios';

        const response = await fetch(url, {
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
        mostrarAlerta('Error al cargar usuarios', 'danger');
    }
}

// Función para mostrar usuarios
function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) {
        console.error('No se encontró la tabla de usuarios');
        return;
    }

    // Filtrar si hay un checkbox para mostrar inactivos
    const mostrarInactivos = document.getElementById('mostrar-inactivos')?.checked || false;
    const usuariosFiltrados = mostrarInactivos ? usuarios : usuarios.filter(usuario => usuario.activo);

    tbody.innerHTML = usuariosFiltrados.map(usuario => `
        <tr class="${usuario.activo ? '' : 'table-secondary'}">
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${formatearTipoUsuario(usuario.tipo)}</td>
            <td>${usuario.activo ? 
                '<span class="badge bg-success">Activo</span>' : 
                '<span class="badge bg-secondary">Inactivo</span>'
            }</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarUsuario(${usuario.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${usuario.activo ? 
                    `<button class="btn btn-sm btn-warning" onclick="desactivarUsuario(${usuario.id})">
                        <i class="fas fa-ban"></i> Desactivar
                    </button>` : 
                    `<button class="btn btn-sm btn-success" onclick="reactivarUsuario(${usuario.id})">
                        <i class="fas fa-check"></i> Reactivar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPermanentemente(${usuario.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>`
                }
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
        console.log(`Intentando editar usuario ID: ${id}`);
        if (!id) {
            throw new Error('ID de usuario no proporcionado');
        }
        
        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para editar usuarios', 'error');
            return;
        }

        // Mostrar indicador de carga
        document.querySelector('#modalUsuario .modal-body').innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando datos del usuario...</span>
                </div>
                <p class="mt-2">Cargando información del usuario...</p>
            </div>
        `;
        
        document.querySelector('#modalUsuario .modal-title').textContent = 'Editar Usuario';
        modalUsuario.show();

        // Obtener datos del usuario del servidor
        const response = await fetch(`/api/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al obtener usuario');
        }

        const usuario = await response.json();
        if (!usuario || !usuario.id) {
            throw new Error('No se pudo obtener información del usuario');
        }
        
        // Guardar el usuario actual en variable global - IMPORTANTE PARA EDICIÓN
        usuarioActual = usuario;
        
        console.log('Datos del usuario cargados (guardados en usuarioActual):', usuario);

        // Restaurar el formulario en el modal - sin usar ID hidden
        document.querySelector('#modalUsuario .modal-body').innerHTML = `
            <form id="formUsuario">
                <div class="mb-3">
                    <label for="usuario-nombre" class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="usuario-nombre" name="usuario-nombre" required value="${usuario.nombre || ''}">
                </div>
                
                <div class="mb-3">
                    <label for="usuario-email" class="form-label">Correo</label>
                    <input type="email" class="form-control" id="usuario-email" name="usuario-email" required value="${usuario.email || ''}">
                </div>
                
                <div class="mb-3">
                    <label for="usuario-tipo" class="form-label">Rol</label>
                    <select class="form-select" id="usuario-tipo" name="usuario-tipo" required>
                        <option value="ADMIN" ${usuario.tipo === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                        <option value="CLIENTE" ${usuario.tipo === 'CLIENTE' ? 'selected' : ''}>Cliente</option>
                        <option value="TRABAJADOR" ${usuario.tipo === 'TRABAJADOR' ? 'selected' : ''}>Trabajador</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="usuario-password" class="form-label">Contraseña</label>
                    <input type="password" class="form-control" id="usuario-password" name="usuario-password">
                    <small class="text-muted">Dejar en blanco para mantener la contraseña actual</small>
                </div>
                
                <!-- Campos específicos para CLIENTE -->
                <div id="campos-cliente" class="campos-tipo-usuario" style="display: ${usuario.tipo === 'CLIENTE' ? 'block' : 'none'}">
                    <div class="mb-3">
                        <label for="usuario-direccion" class="form-label">Dirección</label>
                        <input type="text" class="form-control" id="usuario-direccion" name="usuario-direccion" value="${usuario.direccion || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="usuario-telefono" class="form-label">Teléfono</label>
                        <input type="tel" class="form-control" id="usuario-telefono" name="usuario-telefono" value="${usuario.telefono || ''}">
                    </div>
                </div>

                <!-- Campos específicos para TRABAJADOR -->
                <div id="campos-trabajador" class="campos-tipo-usuario" style="display: ${usuario.tipo === 'TRABAJADOR' ? 'block' : 'none'}">
                    <div class="mb-3">
                        <label for="usuario-posicion" class="form-label">Posición</label>
                        <input type="text" class="form-control" id="usuario-posicion" name="usuario-posicion" ${usuario.trabajador ? `value="${usuario.trabajador.posicion || ''}"` : ''}>
                    </div>
                    <div class="mb-3">
                        <label for="usuario-departamento" class="form-label">Departamento</label>
                        <input type="text" class="form-control" id="usuario-departamento" name="usuario-departamento" ${usuario.trabajador ? `value="${usuario.trabajador.departamento || ''}"` : ''}>
                    </div>
                </div>
            </form>
        `;
        
        // Verificar que todos los elementos se crearon correctamente
        console.log('Elementos del formulario después de crear el HTML:');
        ['usuario-nombre', 'usuario-email', 'usuario-tipo', 'usuario-password'].forEach(id => {
            const element = document.getElementById(id);
            console.log(`- ${id}: ${element ? 'Encontrado' : 'NO ENCONTRADO'}`);
        });
        
        // Añadir evento para mostrar/ocultar campos según tipo de usuario
        const tipoSelect = document.getElementById('usuario-tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', function() {
                actualizarCamposPorTipo(this.value);
            });
        }

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        document.querySelector('#modalUsuario .modal-body').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar datos del usuario: ${error.message}
                <button type="button" class="btn btn-secondary mt-3" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;
        // Asegurarnos de limpiar usuarioActual en caso de error
        usuarioActual = null;
    }
}

// Función para actualizar campos mostrados según el tipo de usuario
function actualizarCamposPorTipo(tipo) {
    const camposCliente = document.getElementById('campos-cliente');
    const camposTrabajador = document.getElementById('campos-trabajador');
    
    if (camposCliente && camposTrabajador) {
        camposCliente.style.display = tipo === 'CLIENTE' ? 'block' : 'none';
        camposTrabajador.style.display = tipo === 'TRABAJADOR' ? 'block' : 'none';
    }
}

// Función para guardar un usuario (creación o edición)
async function guardarUsuario() {
    try {
        const btnGuardar = document.getElementById('btnGuardarUsuario');
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            mostrarAlerta('Sesión expirada, por favor inicia sesión nuevamente', 'error');
            return;
        }
        
        // Obtener elementos del formulario
        const nombreElement = document.getElementById('usuario-nombre');
        const emailElement = document.getElementById('usuario-email');
        const tipoElement = document.getElementById('usuario-tipo');
        const passwordElement = document.getElementById('usuario-password');

        // Verificar si los elementos existen antes de continuar
        if (!nombreElement || !emailElement || !tipoElement) {
            console.error('Error: Faltan elementos del formulario');
            console.log(`nombre: ${nombreElement ? 'Encontrado' : 'NO ENCONTRADO'}`);
            console.log(`email: ${emailElement ? 'Encontrado' : 'NO ENCONTRADO'}`);
            console.log(`tipo: ${tipoElement ? 'Encontrado' : 'NO ENCONTRADO'}`);
            mostrarAlerta('Error en el formulario, por favor recarga la página', 'error');
            return;
        }
        
        // Determinar si es una edición basado en la variable global usuarioActual
        const esEdicion = usuarioActual !== null && usuarioActual.id;
        
        console.log(`Operación detectada: ${esEdicion ? 'EDICIÓN' : 'CREACIÓN'}`);
        console.log(`Estado de usuarioActual:`, usuarioActual);
        
        // Datos básicos del usuario
        const formData = {
            nombre: nombreElement.value,
            email: emailElement.value,
            tipo: tipoElement.value
        };
        
        // Añadir contraseña solo si se está creando un usuario o si se especificó una nueva
        if (passwordElement && passwordElement.value.trim() !== '') {
            formData.password = passwordElement.value;
        }
        
        // Añadir datos adicionales según el tipo de usuario
        if (formData.tipo === 'CLIENTE') {
            const direccionElement = document.getElementById('usuario-direccion');
            const telefonoElement = document.getElementById('usuario-telefono');
            
            if (direccionElement) formData.direccion = direccionElement.value;
            if (telefonoElement) formData.telefono = telefonoElement.value;
        } else if (formData.tipo === 'TRABAJADOR') {
            const posicionElement = document.getElementById('usuario-posicion');
            const departamentoElement = document.getElementById('usuario-departamento');
            
            if (posicionElement) formData.posicion = posicionElement.value;
            if (departamentoElement) formData.departamento = departamentoElement.value;
        }
        
        let url = '/api/usuarios';
        let method = 'POST';
        
        // Si es edición, ajustar URL y método
        if (esEdicion) {
            url = `/api/usuarios/${usuarioActual.id}`;
            method = 'PUT';
        }
        
        console.log(`Enviando solicitud ${method} a ${url} con datos:`, formData);
        
        // Enviar datos al servidor
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al ${esEdicion ? 'actualizar' : 'crear'} usuario`);
        }
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        // Cerrar modal y mostrar mensaje de éxito
        modalUsuario.hide();
        mostrarAlerta(data.message || `Usuario ${esEdicion ? 'actualizado' : 'creado'} correctamente`, 'success');
        
        // Recargar la lista de usuarios
        cargarUsuarios();
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        mostrarAlerta(error.message || 'Error al procesar la solicitud', 'error');
    } finally {
        // Restaurar botón de guardar
        const btnGuardar = document.getElementById('btnGuardarUsuario');
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Usuario';
        }
    }
}

// Función que se ejecuta cuando se abre el modal para crear un nuevo usuario
function mostrarModalCrearUsuario() {
    // Limpiar la variable global usuarioActual - IMPORTANTE
    console.log('Creando nuevo usuario - limpiando variable usuarioActual');
    usuarioActual = null;
    
    document.querySelector('#modalUsuario .modal-title').textContent = 'Crear Usuario';
    
    // Resetear el formulario con la estructura básica
    document.querySelector('#modalUsuario .modal-body').innerHTML = `
        <form id="formUsuario">
            <div class="mb-3">
                <label for="usuario-nombre" class="form-label">Nombre</label>
                <input type="text" class="form-control" id="usuario-nombre" name="usuario-nombre" required>
            </div>
            
            <div class="mb-3">
                <label for="usuario-email" class="form-label">Correo</label>
                <input type="email" class="form-control" id="usuario-email" name="usuario-email" required>
            </div>
            
            <div class="mb-3">
                <label for="usuario-tipo" class="form-label">Rol</label>
                <select class="form-select" id="usuario-tipo" name="usuario-tipo" required>
                    <option value="ADMIN">Administrador</option>
                    <option value="CLIENTE" selected>Cliente</option>
                    <option value="TRABAJADOR">Trabajador</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label for="usuario-password" class="form-label">Contraseña</label>
                <input type="password" class="form-control" id="usuario-password" name="usuario-password" required>
            </div>
            
            <!-- Campos específicos para CLIENTE -->
            <div id="campos-cliente" class="campos-tipo-usuario">
                <div class="mb-3">
                    <label for="usuario-direccion" class="form-label">Dirección</label>
                    <input type="text" class="form-control" id="usuario-direccion" name="usuario-direccion">
                </div>
                <div class="mb-3">
                    <label for="usuario-telefono" class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" id="usuario-telefono" name="usuario-telefono">
                </div>
            </div>

            <!-- Campos específicos para TRABAJADOR -->
            <div id="campos-trabajador" class="campos-tipo-usuario" style="display: none">
                <div class="mb-3">
                    <label for="usuario-posicion" class="form-label">Posición</label>
                    <input type="text" class="form-control" id="usuario-posicion" name="usuario-posicion">
                </div>
                <div class="mb-3">
                    <label for="usuario-departamento" class="form-label">Departamento</label>
                    <input type="text" class="form-control" id="usuario-departamento" name="usuario-departamento">
                </div>
            </div>
        </form>
    `;
    
    // Verificar que todos los elementos se crearon correctamente
    console.log('Elementos del formulario para nuevo usuario:');
    ['usuario-nombre', 'usuario-email', 'usuario-tipo', 'usuario-password'].forEach(id => {
        const element = document.getElementById(id);
        console.log(`- ${id}: ${element ? 'Encontrado' : 'NO ENCONTRADO'}`);
    });
    
    modalUsuario.show();
    
    // Añadir evento para mostrar/ocultar campos según tipo de usuario
    const tipoSelect = document.getElementById('usuario-tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            actualizarCamposPorTipo(this.value);
        });
    } else {
        console.error('No se encontró el elemento select para el tipo de usuario');
    }
}

// Función para desactivar usuario (eliminación lógica)
async function desactivarUsuario(id) {
    try {
        if (!confirm('¿Está seguro de desactivar este usuario? Podrá reactivarlo más tarde.')) {
            return;
        }

        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para desactivar usuarios', 'error');
            return;
        }

        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE', // Sigue siendo DELETE pero ahora hace desactivación lógica
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Intentar obtener la respuesta JSON del servidor
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            console.warn('No se pudo parsear la respuesta como JSON:', e);
        }
        
        // Verificar si la respuesta no es exitosa
        if (!response.ok) {
            console.error('Error del servidor al desactivar:', errorData);
            throw new Error(errorData.message || 'Error al desactivar usuario');
        }

        mostrarAlerta('Usuario desactivado exitosamente', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al desactivar usuario: ' + error.message, 'danger');
    }
}

// Función para reactivar usuario
async function reactivarUsuario(id) {
    try {
        if (!confirm('¿Está seguro de reactivar este usuario?')) {
            return;
        }

        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para reactivar usuarios', 'error');
            return;
        }

        const response = await fetch(`/api/usuarios/${id}/reactivar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Intentar obtener la respuesta JSON del servidor
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            console.warn('No se pudo parsear la respuesta como JSON:', e);
        }
        
        // Verificar si la respuesta no es exitosa
        if (!response.ok) {
            console.error('Error del servidor al reactivar:', errorData);
            throw new Error(errorData.message || 'Error al reactivar usuario');
        }

        mostrarAlerta('Usuario reactivado exitosamente', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al reactivar usuario: ' + error.message, 'danger');
    }
}

// Función para eliminar permanentemente un usuario
async function eliminarPermanentemente(id) {
    try {
        // Mostrar una confirmación más seria
        if (!confirm('⚠️ ADVERTENCIA: Esta acción eliminará permanentemente al usuario y todos sus datos asociados.\n\n¿Está ABSOLUTAMENTE seguro de proceder?')) {
            return;
        }
        
        // Pedir confirmación adicional por texto
        const confirmText = prompt('Para confirmar, escriba "ELIMINAR" en mayúsculas:');
        if (confirmText !== 'ELIMINAR') {
            mostrarAlerta('Operación cancelada: la confirmación no coincide', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        const userData = window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para eliminar usuarios permanentemente', 'error');
            return;
        }

        const response = await fetch(`/api/usuarios/${id}/permanente`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ confirmacion: 'ELIMINAR_PERMANENTEMENTE' })
        });

        // Intentar obtener la respuesta JSON del servidor
        let responseData = {};
        try {
            responseData = await response.json();
        } catch (e) {
            console.warn('No se pudo parsear la respuesta como JSON:', e);
        }
        
        // Verificar si la respuesta no es exitosa
        if (!response.ok) {
            console.error('Error del servidor al eliminar permanentemente:', responseData);
            throw new Error(responseData.message || 'Error al eliminar usuario permanentemente');
        }

        mostrarAlerta('Usuario eliminado permanentemente', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar usuario permanentemente: ' + error.message, 'danger');
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
window.desactivarUsuario = desactivarUsuario;
window.reactivarUsuario = reactivarUsuario;
window.eliminarPermanentemente = eliminarPermanentemente;
window.loadUsers = loadUsers;
window.mostrarModalCrearUsuario = mostrarModalCrearUsuario;

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