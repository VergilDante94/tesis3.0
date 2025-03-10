document.addEventListener('DOMContentLoaded', async () => {
    console.log('Verificando autenticación inicial...');
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const userData = await response.json();
        console.log('Datos de usuario cargados:', userData);
        
        // Actualizar la UI con la información del usuario
        actualizarInfoUsuario(userData);
        
        // Mostrar la sección inicial
        showSection('inicio');
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Referencias
    const darkModeToggle = document.getElementById('darkModeToggle');
    const htmlElement = document.documentElement;

    // Función para actualizar el tema
    function updateTheme(isDark) {
        if (isDark) {
            htmlElement.setAttribute('data-bs-theme', 'dark');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            htmlElement.removeAttribute('data-bs-theme');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    // Verificar preferencia guardada
    const savedTheme = localStorage.getItem('darkMode');
    const isDark = savedTheme === 'true';
    updateTheme(isDark);

    // Evento para cambiar el modo oscuro
    darkModeToggle?.addEventListener('click', function() {
        const isDark = htmlElement.getAttribute('data-bs-theme') === 'dark';
        localStorage.setItem('darkMode', (!isDark).toString());
        updateTheme(!isDark);
    });

    // Manejo de navegación del sidebar
    // Obtener todas las secciones y ocultarlas
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');

    // Mostrar la sección de datos por defecto
    const defaultSection = document.getElementById('datos-section');
    if (defaultSection) defaultSection.style.display = 'block';

    // Verificar tipo de usuario
    const userType = getUserType();
    
    // Mostrar/ocultar elementos según el tipo de usuario
    if (userType === 'ADMIN') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    // Configurar navegación del sidebar
    setupNavigation();
});

function setupNavigation() {
    const sidebarLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    // Función para mostrar una sección
    function showSection(sectionId) {
        console.log('Mostrando sección:', sectionId);
        
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            
            // Verificar permisos de administrador
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = JSON.parse(atob(token));
                    console.log('Verificando permisos para sección:', sectionId, 'Usuario:', userData);
                    
                    // Actualizar elementos de administrador en la sección actual
                    if (userData.tipo === 'ADMIN') {
                        targetSection.querySelectorAll('.admin-only').forEach(element => {
                            element.style.display = 'block';
                            element.classList.remove('d-none');
                        });
                    }
                } catch (error) {
                    console.error('Error al verificar permisos:', error);
                }
            }

            // Cargar datos específicos de la sección
            switch(sectionId) {
                case 'usuarios':
                    if (typeof loadUsers === 'function') {
                        loadUsers();
                    }
                    break;
                case 'ordenes':
                    console.log('Cargando sección de órdenes...');
                    if (typeof loadServicesForOrders === 'function') {
                        loadServicesForOrders();
                    } else {
                        console.error('La función loadServicesForOrders no está definida');
                    }
                    break;
                case 'servicios':
                    if (typeof loadServices === 'function') {
                        loadServices();
                    }
                    break;
                case 'facturas':
                    if (typeof loadInvoices === 'function') {
                        loadInvoices();
                    }
                    break;
                case 'notificaciones':
                    if (typeof loadNotifications === 'function') {
                        loadNotifications();
                    }
                    break;
                case 'perfil':
                    if (typeof loadUserProfile === 'function') {
                        loadUserProfile();
                    }
                    break;
            }
        }

        // Actualizar enlaces activos
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
    }

    // Configurar event listeners para los enlaces del sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remover clase activa de todos los enlaces
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase activa al enlace clickeado
            this.classList.add('active');

            // Mostrar la sección correspondiente
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Mostrar la sección inicial (datos por defecto)
    const defaultSection = 'datos';
    const defaultLink = document.querySelector(`[data-section="${defaultSection}"]`);
    if (defaultLink) {
        defaultLink.classList.add('active');
        showSection(defaultSection);
    }
}

// Función para obtener el token JWT del localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Función para cargar servicios
async function loadServices() {
    try {
        const response = await fetch('/api/servicios', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        // Implementar la lógica para mostrar los servicios
        console.log('Servicios cargados:', data);
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

// Función para cargar usuarios
async function loadUsers() {
    try {
        const response = await fetch('/api/usuarios', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        const usersList = document.getElementById('usersList');
        if (!usersList) {
            console.error('No se encontró el elemento usersList');
            return;
        }

        usersList.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nombre}</td>
                <td>${user.email}</td>
                <td>${formatUserType(user.tipo)}</td>
                <td>
                    <a href="#" class="text-info" onclick="showEditUserModal(${JSON.stringify(user)})">Editar</a> | 
                    <a href="#" class="text-danger" onclick="deleteUser(${user.id})">Eliminar</a>
                </td>
            `;
            usersList.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showAlert('Error al cargar usuarios', 'danger');
    }
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

// Funciones placeholder para otras secciones
function loadOrders() {
    console.log('Cargando órdenes...');
}

function loadInvoices() {
    console.log('Cargando facturas...');
}

function loadNotifications() {
    console.log('Cargando notificaciones...');
}

function loadProfile() {
    console.log('Cargando perfil...');
}

function loadData() {
    console.log('Cargando datos...');
}

// Función auxiliar para obtener el tipo de usuario
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

// Actualiza los estilos CSS
const styles = `
    .table thead {
        background-color: #0d6efd;
    }
    
    .table thead th {
        color: white;
        font-weight: normal;
    }
    
    .btn-info {
        background-color: #17a2b8;
        border-color: #17a2b8;
    }
    
    .text-info {
        color: #17a2b8 !important;
        text-decoration: none;
    }
    
    .text-danger {
        text-decoration: none;
    }
    
    tr:nth-child(even) {
        background-color: #f2f2f2;
    }
`;

// Agrega los estilos al documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Función para alternar el tema oscuro/claro
function toggleDarkMode() {
    const html = document.documentElement;
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (html.getAttribute('data-bs-theme') === 'dark') {
        html.setAttribute('data-bs-theme', 'light');
        themeIcon.className = ''; // Limpiamos la clase primero
        themeIcon.classList.add('fas', 'fa-moon');
    } else {
        html.setAttribute('data-bs-theme', 'dark');
        themeIcon.className = ''; // Limpiamos la clase primero
        themeIcon.classList.add('fas', 'fa-sun');
    }
}

// Event listener para el botón de tema
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
});