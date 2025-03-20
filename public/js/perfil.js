document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando página de perfil...');
    
    // Cargar información del perfil para todos los usuarios
    cargarPerfil();

    // Verificar si es administrador y mostrar sección adicional
    const userType = getUserType();
    console.log('Tipo de usuario detectado:', userType);
    
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
    console.log('Configurando event listeners...');
    
    // Botón nuevo usuario
    const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
    if (btnNuevoUsuario) {
        btnNuevoUsuario.addEventListener('click', () => {
            document.getElementById('usuario-form').reset();
            document.getElementById('usuario-id').value = '';
            document.getElementById('usuarioModalLabel').textContent = 'Nuevo Usuario';
            const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
            modal.show();
        });
    }

    // Botón guardar usuario
    const btnGuardarUsuario = document.getElementById('btn-guardar-usuario');
    if (btnGuardarUsuario) {
        btnGuardarUsuario.addEventListener('click', guardarUsuario);
    }

    // Botón editar perfil - ELEMENTO CRÍTICO
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    if (btnEditarPerfil) {
        console.log('Botón editar perfil encontrado, configurando event listener');
        btnEditarPerfil.addEventListener('click', showEditProfileModal);
        
        // Asegurarnos que el botón sea visible para administradores
        const userType = getUserType();
        if (userType === 'ADMIN') {
            btnEditarPerfil.style.display = 'inline-block';
            console.log('Botón editar perfil habilitado para administrador');
        }
    } else {
        console.warn('⚠️ Botón editar perfil NO encontrado');
    }

    // Botón guardar perfil - ELEMENTO CRÍTICO
    const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');
    if (btnGuardarPerfil) {
        console.log('Botón guardar perfil encontrado, configurando event listener');
        btnGuardarPerfil.addEventListener('click', saveProfileChanges);
    } else {
        console.warn('⚠️ Botón guardar perfil NO encontrado');
    }
    
    // Verificar que tenemos acceso a Bootstrap
    if (typeof bootstrap === 'undefined') {
        console.error('⚠️ Error: Bootstrap no está disponible');
    } else {
        console.log('Bootstrap disponible para modales');
    }
}

async function cargarPerfil() {
    console.log('Cargando perfil de usuario...');
    try {
        // Obtener datos del servidor
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No hay token disponible');
            return;
        }
        
        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al cargar perfil: ${response.status}`);
        }

        const userInfo = await response.json();
        console.log('Datos del perfil recibidos:', userInfo);
        
        // Actualizar localStorage con los datos más recientes
        localStorage.setItem('usuario', JSON.stringify(userInfo));
        
        // Mostrar información en la página - ELEMENTOS CRÍTICOS
        mostrarInformacionPerfil(userInfo);
        
        return userInfo;
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        mostrarAlerta('Error al cargar información del perfil', 'danger');
    }
}

function mostrarInformacionPerfil(userInfo) {
    console.log('Actualizando interfaz con datos del perfil:', userInfo);
    
    // Actualizar nombre
    const nombreDisplay = document.getElementById('perfil-nombre-display');
    if (nombreDisplay) {
        nombreDisplay.textContent = userInfo.nombre || 'No especificado';
        console.log('Nombre actualizado:', nombreDisplay.textContent);
    } else {
        console.warn('⚠️ Elemento perfil-nombre-display no encontrado');
    }
    
    // Actualizar email
    const emailElement = document.getElementById('perfil-email');
    if (emailElement) {
        emailElement.textContent = userInfo.email || 'No especificado';
        console.log('Email actualizado:', emailElement.textContent);
    } else {
        console.warn('⚠️ Elemento perfil-email no encontrado');
    }
    
    // Actualizar tipo/rol
    const tipoElement = document.getElementById('perfil-tipo');
    if (tipoElement) {
        tipoElement.textContent = formatearRol(userInfo.tipo || userInfo.rol) || 'No especificado';
        console.log('Tipo actualizado:', tipoElement.textContent);
    } else {
        console.warn('⚠️ Elemento perfil-tipo no encontrado');
    }
    
    // Actualizar dirección con efecto visual
    const direccionElement = document.getElementById('perfil-direccion');
    if (direccionElement) {
        // Usar la función para marcar la actualización visualmente
        marcarCampoActualizado('perfil-direccion', userInfo.direccion);
    } else {
        console.warn('⚠️ Elemento perfil-direccion no encontrado');
        // Intentar con selector alternativo
        document.querySelectorAll('p').forEach(p => {
            if (p.textContent.includes('Dirección:')) {
                const span = p.querySelector('span');
                if (span) {
                    const textoOriginal = span.textContent;
                    span.textContent = userInfo.direccion || 'No especificada';
                    console.log(`Dirección actualizada alternativamente de "${textoOriginal}" a "${span.textContent}"`);
                    span.style.backgroundColor = '#f8f9a8';
                    setTimeout(() => { span.style.backgroundColor = 'transparent'; }, 3000);
                }
            }
        });
    }
    
    // Actualizar teléfono con efecto visual
    const telefonoElement = document.getElementById('perfil-telefono');
    if (telefonoElement) {
        // Usar la función para marcar la actualización visualmente
        marcarCampoActualizado('perfil-telefono', userInfo.telefono);
    } else {
        console.warn('⚠️ Elemento perfil-telefono no encontrado');
        // Intentar con selector alternativo
        document.querySelectorAll('p').forEach(p => {
            if (p.textContent.includes('Teléfono:')) {
                const span = p.querySelector('span');
                if (span) {
                    const textoOriginal = span.textContent;
                    span.textContent = userInfo.telefono || 'No especificado';
                    console.log(`Teléfono actualizado alternativamente de "${textoOriginal}" a "${span.textContent}"`);
                    span.style.backgroundColor = '#f8f9a8';
                    setTimeout(() => { span.style.backgroundColor = 'transparent'; }, 3000);
                }
            }
        });
    }
    
    // Actualizar nombre en el encabezado si existe
    const usuarioActualElement = document.getElementById('usuario-actual');
    if (usuarioActualElement) {
        usuarioActualElement.textContent = userInfo.nombre || '';
    }
    
    // Mostrar botón de edición para administradores
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    if (btnEditarPerfil) {
        const userType = userInfo.tipo || userInfo.rol;
        if (userType === 'ADMIN') {
            btnEditarPerfil.style.display = 'inline-block';
            console.log('Botón de edición de perfil mostrado para administrador');
        } else {
            btnEditarPerfil.style.display = 'none';
        }
    }
}

function formatearRol(tipo) {
    const roles = {
        'ADMIN': 'Administrador',
        'CLIENTE': 'Cliente',
        'TRABAJADOR': 'Trabajador'
    };
    return roles[tipo] || tipo;
}

function getUserType() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const decoded = window.decodeJWT(token);
        return decoded.tipo;
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
    }
}

// Función para mostrar el modal de edición de perfil
async function showEditProfileModal() {
    console.log('INICIANDO FUNCIÓN MOSTRAR MODAL');
    try {
        // Verificar si el usuario es administrador
        const userType = getUserType();
        if (userType !== 'ADMIN') {
            mostrarAlerta('Solo los administradores pueden editar perfiles', 'danger');
            return;
        }
        
        // Mostrar spinner en el botón mientras cargamos los datos
        const btnEditarPerfil = document.getElementById('btn-editar-perfil');
        if (btnEditarPerfil) {
            btnEditarPerfil.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
            btnEditarPerfil.disabled = true;
        }
        
        try {
            // LIMPIAR VARIABLES GLOBALES AL INICIO
            window.nuevaDireccion = undefined;
            window.nuevoTelefono = undefined;
            console.log('🔄 Variables globales limpiadas al abrir el modal');
            
            // Primero, mostrar el modal vacío para evitar retrasos en la UI
            const modalElement = document.getElementById('modalEditarPerfil');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                console.log('Modal mostrado (inicialmente vacío)');
                
                // IMPORTANTE: Configurar event listeners ANTES de cargar datos
                configureModalListeners();
            } else {
                console.error('Modal element not found');
                return;
            }
            
            // IMPORTANTE: Ahora cargar datos después de mostrar el modal
            const token = localStorage.getItem('token');
            const response = await fetch('/api/usuarios/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al obtener datos del perfil');
            }
            
            const userInfo = await response.json();
            console.log('Datos más recientes obtenidos para el modal:', userInfo);
            
            // Actualizar también en localStorage
            localStorage.setItem('usuario', JSON.stringify(userInfo));
            
            // Llenar el formulario con los datos actuales
            const nombreInput = document.getElementById('perfil-nombre');
            if (nombreInput) {
                nombreInput.value = userInfo.nombre || '';
                console.log('Campo nombre en modal cargado con:', nombreInput.value);
            }
            
            // Asegurarse de cargar los valores existentes de dirección y teléfono
            const direccionInput = document.getElementById('perfil-direccion');
            if (direccionInput) {
                direccionInput.value = userInfo.direccion || '';
                console.log('Campo dirección en modal cargado con:', direccionInput.value);
            } else {
                console.warn('Campo de dirección no encontrado en el DOM');
            }
            
            const telefonoInput = document.getElementById('perfil-telefono');
            if (telefonoInput) {
                telefonoInput.value = userInfo.telefono || '';
                console.log('Campo teléfono en modal cargado con:', telefonoInput.value);
            } else {
                console.warn('Campo de teléfono no encontrado en el DOM');
            }
            
            // Limpiar el campo de contraseña
            const passwordInput = document.getElementById('perfil-password');
            if (passwordInput) {
                passwordInput.value = '';
            }
            
        } catch (error) {
            console.error('Error al obtener datos del perfil:', error);
            mostrarAlerta('Error al obtener datos del perfil', 'danger');
            
            // Fallback a localStorage si hay error
            const userInfo = JSON.parse(localStorage.getItem('usuario'));
            
            // Llenar el formulario con los datos de localStorage
            const nombreInput = document.getElementById('perfil-nombre');
            if (nombreInput) {
                nombreInput.value = userInfo.nombre || '';
            }
            
            const direccionInput = document.getElementById('perfil-direccion');
            if (direccionInput) {
                direccionInput.value = userInfo.direccion || '';
            }
            
            const telefonoInput = document.getElementById('perfil-telefono');
            if (telefonoInput) {
                telefonoInput.value = userInfo.telefono || '';
            }
        }
        
    } catch (error) {
        console.error('Error general al mostrar modal:', error);
        mostrarAlerta('Error al preparar el formulario', 'danger');
    } finally {
        // Restaurar botón
        const btnEditarPerfil = document.getElementById('btn-editar-perfil');
        if (btnEditarPerfil) {
            btnEditarPerfil.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
            btnEditarPerfil.disabled = false;
        }
    }
}

// NUEVA FUNCIÓN: Configurar listeners del modal
function configureModalListeners() {
    console.log('🔔 Configurando event listeners del modal');
    
    // Event listener para nombre
    const nombreInput = document.getElementById('perfil-nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', (e) => {
            console.log('🔴 Nombre cambiado a:', e.target.value);
        });
        console.log('✅ Event listener para nombre configurado');
    }
    
    // Event listener para dirección - CRÍTICO
    const direccionInput = document.getElementById('perfil-direccion');
    if (direccionInput) {
        // Remover listeners previos si existen
        const nuevoListener = (e) => {
            const nuevoValor = e.target.value;
            console.log('🔴 Dirección cambiada a:', nuevoValor);
            window.nuevaDireccion = nuevoValor;
            console.log('✅ Variable global nuevaDireccion actualizada a:', window.nuevaDireccion);
        };
        
        // Asegurarse de que solo haya un listener
        direccionInput.removeEventListener('input', nuevoListener);
        direccionInput.addEventListener('input', nuevoListener);
        
        // También agregar listener de cambio de foco
        direccionInput.addEventListener('change', (e) => {
            console.log('🟠 Dirección después de perder foco:', e.target.value);
            window.nuevaDireccion = e.target.value;
        });
        
        console.log('✅ Event listeners para dirección configurados');
        
        // Forzar foco en el campo de dirección - esto ayuda a detectar problemas
        setTimeout(() => {
            console.log('🟢 Intentando forzar foco en campo de dirección');
            try {
                direccionInput.focus();
                direccionInput.select();
            } catch(e) {
                console.error('Error al forzar foco:', e);
            }
        }, 500);
    } else {
        console.error('❌ CRÍTICO: Campo dirección no encontrado');
        // Buscar todos los inputs del documento para depuración
        const allInputs = document.querySelectorAll('input');
        console.log('🔍 Todos los inputs disponibles:', Array.from(allInputs).map(i => i.id || 'sin-id'));
    }
    
    // Event listener para teléfono - CRÍTICO
    const telefonoInput = document.getElementById('perfil-telefono');
    if (telefonoInput) {
        // Remover listeners previos si existen
        const nuevoListener = (e) => {
            const nuevoValor = e.target.value;
            console.log('🔴 Teléfono cambiado a:', nuevoValor);
            window.nuevoTelefono = nuevoValor;
            console.log('✅ Variable global nuevoTelefono actualizada a:', window.nuevoTelefono);
        };
        
        // Asegurarse de que solo haya un listener
        telefonoInput.removeEventListener('input', nuevoListener);
        telefonoInput.addEventListener('input', nuevoListener);
        
        // También agregar listener de cambio de foco
        telefonoInput.addEventListener('change', (e) => {
            console.log('🟠 Teléfono después de perder foco:', e.target.value);
            window.nuevoTelefono = e.target.value;
        });
        
        console.log('✅ Event listeners para teléfono configurados');
    } else {
        console.error('❌ CRÍTICO: Campo teléfono no encontrado');
    }
}

// Función simplificada para guardar cambios del perfil
async function saveProfileChanges() {
    console.log('Guardando cambios del perfil...');
    try {
        // Verificar si el usuario es administrador
        const userType = getUserType();
        if (userType !== 'ADMIN') {
            mostrarAlerta('No tienes permiso para realizar esta acción', 'danger');
            return;
        }
        
        // Desactivar el botón para evitar múltiples envíos
        const saveButton = document.getElementById('btn-guardar-perfil');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
        }
        
        // SOLUCIÓN: Obtener los inputs ESPECÍFICAMENTE del modal
        console.log('🔍 Verificando todos los inputs visibles en el modal:');
        const modalInputs = {};
        document.querySelectorAll('#modalEditarPerfil input').forEach(input => {
            console.log(`Input ${input.id || 'sin-id'}: ${input.value}`);
            
            // Guardar referencia específica al input
            if (input.id) {
                modalInputs[input.id] = input.value;
            }
        });
        
        console.log('📋 Valores capturados del modal:', modalInputs);
        
        // IMPORTANTE: Usar EXCLUSIVAMENTE los valores del modal
        const nombre = modalInputs['perfil-nombre'] || 'Administrador';
        const direccion = modalInputs['perfil-direccion'] || '';
        const telefono = modalInputs['perfil-telefono'] || '';
        const password = modalInputs['perfil-password'] || '';
        
        console.log('✅ VALORES FINALES A GUARDAR:');
        console.log('- Nombre:', nombre);
        console.log('- Dirección:', direccion);
        console.log('- Teléfono:', telefono);
        console.log('- Password presente:', password ? 'Sí' : 'No');
        
        // Crear objeto con datos para enviar
        const userData = {
            nombre: nombre,
            direccion: direccion,
            telefono: telefono
        };
        
        if (password) {
            userData.password = password;
        }
        
        console.log('📤 Datos a enviar al servidor:', JSON.stringify(userData));
        
        // Confirmación explícita
        console.log('⚠️ CONFIRMACIÓN DE VALORES FINALES:');
        console.log(`Dirección: "${direccion}"`);
        console.log(`Teléfono: "${telefono}"`);
        
        // Enviar datos al servidor
        const token = localStorage.getItem('token');
        const response = await fetch('/api/usuarios/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error(`Error al guardar cambios: ${response.status}`);
        }
        
        const updatedUser = await response.json();
        console.log('🎉 Perfil actualizado correctamente con datos del servidor:', updatedUser);
        
        // Actualizar localStorage
        localStorage.setItem('usuario', JSON.stringify(updatedUser));
        
        // Cerrar el modal
        const modalElement = document.getElementById('modalEditarPerfil');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        
        // Limpiar variables globales temporales
        console.log('🔄 Limpiando variables globales después de guardar');
        window.nuevaDireccion = undefined;
        window.nuevoTelefono = undefined;
        
        // ACTUALIZACIÓN DIRECTA Y FORZADA DE ELEMENTOS ESPECÍFICOS
        console.log('Actualizando interfaz directamente con valores específicos');
        
        // Actualizar dirección explícitamente (en la VISTA, no en el modal)
        const direccionElement = document.getElementById('perfil-direccion');
        if (direccionElement) {
            direccionElement.textContent = updatedUser.direccion || 'No especificada';
            console.log('Dirección actualizada DIRECTAMENTE a:', direccionElement.textContent);
            // Marcar visualmente la actualización
            marcarCampoActualizado('perfil-direccion', updatedUser.direccion);
        } else {
            // Intento con método alternativo
            document.querySelectorAll('p').forEach(p => {
                if (p.textContent.includes('Dirección:')) {
                    const span = p.querySelector('span');
                    if (span) {
                        span.textContent = updatedUser.direccion || 'No especificada';
                        span.style.backgroundColor = '#f8f9a8';
                        setTimeout(() => { span.style.backgroundColor = 'transparent'; }, 3000);
                        console.log('Dirección actualizada con selector alternativo');
                    }
                }
            });
        }
        
        // Actualizar teléfono explícitamente (en la VISTA, no en el modal)
        const telefonoElement = document.getElementById('perfil-telefono');
        if (telefonoElement) {
            telefonoElement.textContent = updatedUser.telefono || 'No especificado';
            console.log('Teléfono actualizado DIRECTAMENTE a:', telefonoElement.textContent);
            // Marcar visualmente la actualización
            marcarCampoActualizado('perfil-telefono', updatedUser.telefono);
        } else {
            // Intento con método alternativo
            document.querySelectorAll('p').forEach(p => {
                if (p.textContent.includes('Teléfono:')) {
                    const span = p.querySelector('span');
                    if (span) {
                        span.textContent = updatedUser.telefono || 'No especificado';
                        span.style.backgroundColor = '#f8f9a8';
                        setTimeout(() => { span.style.backgroundColor = 'transparent'; }, 3000);
                        console.log('Teléfono actualizado con selector alternativo');
                    }
                }
            });
        }
        
        // Actualizar la interfaz general
        mostrarInformacionPerfil(updatedUser);
        
        // Forzar recarga de perfil
        setTimeout(() => {
            console.log('Forzando recarga completa del perfil desde el servidor');
            cargarPerfil();
        }, 500);
        
        // Verificar si los datos se actualizaron
        setTimeout(() => {
            console.log('Verificando actualización...');
            const dirActual = document.getElementById('perfil-direccion')?.textContent;
            const telActual = document.getElementById('perfil-telefono')?.textContent;
            console.log('Dirección actual en DOM:', dirActual);
            console.log('Teléfono actual en DOM:', telActual);
            
            console.log('¿Valores actualizados correctamente?', {
                direccion: dirActual === updatedUser.direccion,
                telefono: telActual === updatedUser.telefono
            });
            
            if (dirActual !== updatedUser.direccion) {
                console.warn('⚠️ La dirección no se actualizó correctamente en la interfaz');
                // Intento adicional de actualización
                document.querySelectorAll('p').forEach(p => {
                    if (p.textContent.includes('Dirección:')) {
                        const span = p.querySelector('span');
                        if (span) {
                            span.textContent = updatedUser.direccion || 'No especificada';
                            console.log('Dirección actualizada con selector alternativo (intento adicional)');
                        }
                    }
                });
            }
        }, 1000);
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Perfil actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarAlerta(`Error al guardar cambios: ${error.message}`, 'danger');
    } finally {
        // Reactivar el botón
        const saveButton = document.getElementById('btn-guardar-perfil');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Guardar Cambios';
        }
    }
}

// Función para visualizar actualizaciones (debugging)
function marcarCampoActualizado(elementId, nuevoValor) {
    const elemento = document.getElementById(elementId);
    if (!elemento) {
        console.warn(`Elemento ${elementId} no encontrado para marcar actualización`);
        return;
    }
    
    // Guardar el texto original
    const textoOriginal = elemento.textContent;
    
    // Actualizar el texto
    elemento.textContent = nuevoValor || 'No especificado';
    
    // Aplicar un efecto visual temporal
    elemento.style.backgroundColor = '#f8f9a8';  // Amarillo claro
    elemento.style.padding = '2px 4px';
    elemento.style.borderRadius = '3px';
    elemento.style.transition = 'background-color 2s ease';
    
    // Mostrar notificación en consola
    console.log(`Campo ${elementId} actualizado de "${textoOriginal}" a "${elemento.textContent}"`);
    
    // Quitar el efecto después de unos segundos
    setTimeout(() => {
        elemento.style.backgroundColor = 'transparent';
    }, 3000);
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
        if (tbody) {
            tbody.innerHTML = usuarios.map(usuario => crearFilaUsuario(usuario)).join('');
        }
    } catch (error) {
        console.error('Error al cargar lista de usuarios:', error);
        mostrarAlerta('Error al cargar usuarios', 'danger');
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
        console.log('=== INICIO DE GUARDADO DE USUARIO ===');
        
        // Obtener el elemento usuario-id con verificación
        const usuarioIdElement = document.getElementById('usuario-id');
        const usuarioId = usuarioIdElement ? usuarioIdElement.value : '';
        console.log(`ID de usuario encontrado: ${usuarioId || 'NO ENCONTRADO (nuevo usuario)'}`);
        
        // IMPORTANTE: Verificar si tenemos una variable global de usuario para edición
        console.log('Estado de variable global usuarioActual:', window.usuarioActual || 'NO DEFINIDA');
        
        // ID final a utilizar (prioriza el elemento del DOM, luego la variable global)
        const idFinal = usuarioId || (window.usuarioActual ? window.usuarioActual.id : '');
        console.log(`ID final a utilizar: ${idFinal || 'NINGUNO (creación de nuevo usuario)'}`);
        
        // Obtener los elementos necesarios para el formulario
        const nombreElement = document.getElementById('usuario-nombre');
        const emailElement = document.getElementById('usuario-email');
        const tipoElement = document.getElementById('usuario-tipo');
        const passwordElement = document.getElementById('usuario-password');
        
        // Verificar que existan los elementos necesarios
        console.log('=== VERIFICACIÓN DE ELEMENTOS DEL FORMULARIO ===');
        console.log('- Nombre:', nombreElement ? `ENCONTRADO: ${nombreElement.value}` : 'NO ENCONTRADO');
        console.log('- Email:', emailElement ? `ENCONTRADO: ${emailElement.value}` : 'NO ENCONTRADO');
        console.log('- Tipo:', tipoElement ? `ENCONTRADO: ${tipoElement.value}` : 'NO ENCONTRADO');
        console.log('- Password:', passwordElement ? `ENCONTRADO: ${passwordElement.value ? '(valor no vacío)' : '(valor vacío)'}` : 'NO ENCONTRADO');
        
        if (!nombreElement || !emailElement || !tipoElement) {
            console.error('Elementos del formulario no encontrados:', {
                nombre: !!nombreElement,
                email: !!emailElement,
                tipo: !!tipoElement
            });
            
            // Verificar si estamos en el modal correcto
            const formUsuario = document.getElementById('formUsuario');
            if (!formUsuario) {
                console.error('El formulario formUsuario no existe en el DOM');
            }
            
            // Intentar obtener todos los inputs en el document para debug
            console.log('=== TODOS LOS ELEMENTOS DE FORMULARIO DISPONIBLES ===');
            document.querySelectorAll('input, select').forEach(el => {
                console.log(`- ${el.id || 'sin-id'}: ${el.tagName} (${el.type || 'sin-tipo'}) - Valor: "${el.value || 'vacío'}"`);
            });
            
            // Intentar obtener referencia al modal
            const modal = document.getElementById('modalUsuario');
            if (!modal) {
                console.error('Modal de usuario no encontrado en el DOM');
            }
            
            mostrarAlerta('Error: Formulario incompleto. Consulta la consola para más detalles.', 'danger');
            return;
        }
        
        // Crear objeto con datos del formulario, usando valores seguros
        const formData = {
            nombre: nombreElement.value || '',
            email: emailElement.value || '',
            tipo: tipoElement.value || 'CLIENTE'
        };

        // Campos adicionales según el tipo de usuario
        if (formData.tipo === 'CLIENTE') {
            const direccionElement = document.getElementById('usuario-direccion');
            const telefonoElement = document.getElementById('usuario-telefono');
            
            if (direccionElement) {
                formData.direccion = direccionElement.value || '';
                console.log(`- Campo dirección añadido: "${formData.direccion}"`);
            }
            
            if (telefonoElement) {
                formData.telefono = telefonoElement.value || '';
                console.log(`- Campo teléfono añadido: "${formData.telefono}"`);
            }
        } else if (formData.tipo === 'TRABAJADOR') {
            const posicionElement = document.getElementById('usuario-posicion');
            const departamentoElement = document.getElementById('usuario-departamento');
            
            if (posicionElement) {
                formData.posicion = posicionElement.value || '';
                console.log(`- Campo posición añadido: "${formData.posicion}"`);
            }
            
            if (departamentoElement) {
                formData.departamento = departamentoElement.value || '';
                console.log(`- Campo departamento añadido: "${formData.departamento}"`);
            }
        }

        // IMPORTANTE: Para la contraseña, asegurarnos de que siempre enviamos un string
        // y solo incluimos el campo si tiene un valor no vacío
        const password = passwordElement ? passwordElement.value.trim() : '';
        if (password && password !== '') {
            formData.password = password; // Usar "password" en lugar de "contrasena" según el error del servidor
            console.log('- Campo password añadido (valor no mostrado por seguridad)');
        } else {
            console.log('- Campo password NO añadido (campo vacío o no encontrado)');
        }

        console.log('=== RESUMEN DE DATOS A ENVIAR ===');
        const dataCopy = {...formData};
        if (dataCopy.password) dataCopy.password = '[OCULTO]';
        console.log(JSON.stringify(dataCopy, null, 2));

        const url = idFinal ? `/api/usuarios/${idFinal}` : '/api/usuarios';
        const method = idFinal ? 'PUT' : 'POST';
        console.log(`Operación: ${method} a ${url}`);

        // Verificar token antes de enviar
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token no encontrado en localStorage');
            mostrarAlerta('No hay sesión activa. Inicie sesión nuevamente.', 'danger');
            return;
        }
        console.log('Token encontrado en localStorage');

        console.log('=== ENVIANDO SOLICITUD AL SERVIDOR ===');
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        console.log(`Respuesta del servidor - Status: ${response.status} ${response.statusText}`);
        
        // Intentar obtener la respuesta como JSON
        let responseData;
        try {
            responseData = await response.json();
            console.log('Datos de respuesta:', responseData);
        } catch (e) {
            console.error('Error al parsear respuesta JSON:', e);
            responseData = { message: 'Error de comunicación con el servidor' };
        }

        if (!response.ok) {
            console.error('Respuesta del servidor:', responseData);
            throw new Error('Error al guardar usuario: ' + (responseData.message || response.statusText));
        }

        mostrarAlerta('Usuario guardado exitosamente', 'success');
        
        // Limpiar variable global después de guardar exitosamente
        if (window.usuarioActual) {
            console.log('Limpiando variable global usuarioActual');
            window.usuarioActual = null;
        }
        
        // Cerrar el modal si existe
        const modalElement = document.getElementById('modalUsuario');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            } else {
                console.warn('No se pudo obtener la instancia del modal');
            }
        } else {
            console.warn('No se encontró el elemento del modal');
        }
        
        // Recargar la lista de usuarios
        if (typeof cargarListaUsuarios === 'function') {
            cargarListaUsuarios();
        } else if (typeof loadUsers === 'function') {
            loadUsers();
        } else {
            console.warn('No se encontró función para recargar usuarios');
            // Opcional: recargar la página después de una pausa breve
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        mostrarAlerta('Error al guardar usuario: ' + error.message, 'danger');
    }
}

async function editarUsuario(id) {
    try {
        console.log(`Intentando editar usuario con ID: ${id} desde perfil.js`);
        if (!id) {
            throw new Error('ID de usuario no proporcionado');
        }
        
        // Verificar si hay una función de edición en usuarios.js que podamos reutilizar
        if (window.editarUsuario && window.editarUsuario !== editarUsuario) {
            console.log('Delegando a la función editarUsuario en usuarios.js');
            return window.editarUsuario(id);
        }
        
        const token = localStorage.getItem('token');
        const userData = window.getUserInfo && window.getUserInfo();
        
        if (!userData || userData.tipo !== 'ADMIN') {
            mostrarAlerta('No tienes permisos para editar usuarios', 'error');
            return;
        }
        
        // Obtener datos del usuario primero
        const response = await fetch(`/api/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al obtener datos del usuario');
        }

        const usuario = await response.json();
        console.log('Datos del usuario cargados:', usuario);
        
        // Guardar el usuario en la variable global
        window.usuarioActual = usuario;
        console.log('Variable global usuarioActual actualizada:', window.usuarioActual);
        
        // Ahora, verificar si existe el modal de usuario de usuarios.js
        const modalUsuarioElement = document.getElementById('modalUsuario');
        if (modalUsuarioElement) {
            console.log('Utilizando modal de usuarios.js para edición');
            
            // Actualizar el título del modal
            const modalTitle = modalUsuarioElement.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Editar Usuario';
            }
            
            // Actualizar el contenido del modal
            const modalBody = modalUsuarioElement.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
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
                
                // Añadir evento para mostrar/ocultar campos según tipo de usuario
                const tipoSelect = document.getElementById('usuario-tipo');
                if (tipoSelect) {
                    tipoSelect.addEventListener('change', function() {
                        const camposCliente = document.getElementById('campos-cliente');
                        const camposTrabajador = document.getElementById('campos-trabajador');
                        
                        if (camposCliente && camposTrabajador) {
                            camposCliente.style.display = this.value === 'CLIENTE' ? 'block' : 'none';
                            camposTrabajador.style.display = this.value === 'TRABAJADOR' ? 'block' : 'none';
                        }
                    });
                }
            }
            
            // Mostrar el modal usando Bootstrap
            try {
                const modalInstance = new bootstrap.Modal(modalUsuarioElement);
                modalInstance.show();
            } catch (error) {
                console.error('Error al mostrar el modal:', error);
                // Intento alternativo
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    bootstrap.Modal.getOrCreateInstance(modalUsuarioElement).show();
                } else {
                    throw new Error('No se pudo inicializar el modal: Bootstrap no disponible');
                }
            }
            
            return;
        }
        
        // Si llegamos aquí, es porque no encontramos el modal de usuarios.js
        // Usamos el modal original del perfil
        console.log('Usando modal original del perfil para edición');
        
        // Verificar los elementos del formulario existente
        const nombreElement = document.getElementById('usuario-nombre');
        const emailElement = document.getElementById('usuario-email');
        const tipoElement = document.getElementById('usuario-tipo');
        const passwordElement = document.getElementById('usuario-password');
        const modalLabelElement = document.getElementById('usuarioModalLabel');
        
        // Verificar que los elementos necesarios existan
        if (!nombreElement || !emailElement || !tipoElement) {
            console.error('Elementos del formulario no encontrados:', {
                nombre: !!nombreElement,
                email: !!emailElement,
                tipo: !!tipoElement
            });
            
            // Listar todos los elementos para debug
            console.log('Elementos de formulario disponibles:');
            document.querySelectorAll('input, select').forEach(el => {
                console.log(`- ${el.id || 'sin-id'}: ${el.tagName}`);
            });
            
            mostrarAlerta('Error: No se pueden cargar los elementos del formulario', 'danger');
            return;
        }
        
        // Asignar valores a los elementos
        nombreElement.value = usuario.nombre || '';
        emailElement.value = usuario.email || '';
        tipoElement.value = usuario.tipo || 'CLIENTE';
        
        if (passwordElement) {
            passwordElement.value = ''; // Limpiar el campo de contraseña
        }
        
        if (modalLabelElement) {
            modalLabelElement.textContent = 'Editar Usuario';
        }

        // Obtener referencia al modal y mostrarlo
        const modalElement = document.getElementById('usuarioModal');
        if (!modalElement) {
            console.error('Modal no encontrado: usuarioModal');
            mostrarAlerta('Error: No se puede mostrar el modal', 'danger');
            return;
        }
        
        try {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } catch (e) {
            console.error('Error al mostrar modal:', e);
            mostrarAlerta('Error al mostrar el formulario de edición', 'danger');
        }
    } catch (error) {
        console.error('Error al editar usuario:', error);
        mostrarAlerta('Error al cargar usuario: ' + error.message, 'danger');
        // Limpiar la variable global en caso de error
        window.usuarioActual = null;
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

        // Intentar obtener la respuesta JSON del servidor
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            console.warn('No se pudo parsear la respuesta como JSON:', e);
        }
        
        // Verificar si la respuesta no es exitosa
        if (!response.ok) {
            console.error('Error del servidor al eliminar:', errorData);
            
            // Verificar en los logs del navegador si hay errores de clave foránea
            const consoleOutput = document.querySelector('.console-output')?.textContent || '';
            const hasForeignKeyError = 
                consoleOutput.includes('Foreign key constraint') || 
                consoleOutput.includes('P2003') ||
                errorData.code === 'P2003';
            
            // Mensaje personalizado basado en diferentes indicadores
            if (hasForeignKeyError || 
                (errorData.message && typeof errorData.message === 'string' && 
                 (errorData.message.toLowerCase().includes('constraint') || 
                  errorData.message.toLowerCase().includes('eliminar')))) {
                throw new Error('No se puede eliminar este usuario porque tiene registros asociados (órdenes, servicios, etc.)');
            }
            
            throw new Error(errorData.message || 'Error al eliminar usuario');
        }

        mostrarAlerta('Usuario eliminado correctamente', 'success');
        cargarListaUsuarios();
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        
        // Mensaje más informativo si detectamos un patrón de error de clave foránea
        let errorMsg = error.message;
        if (error.message === 'Error al eliminar usuario') {
            errorMsg = 'No se puede eliminar este usuario porque está asociado a registros en el sistema (órdenes, clientes, etc.).';
        }
        
        mostrarAlerta('Error al eliminar usuario: ' + errorMsg, 'danger');
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
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;