/**
 * Funciones de utilidad para responsividad
 */

// Detecta si el dispositivo es móvil o tablet
function isMobileDevice() {
    return window.innerWidth < 992;
}

// Detecta si el dispositivo es solo móvil (no tablet)
function isSmallMobileDevice() {
    return window.innerWidth < 576;
}

// Ajusta elementos de la interfaz basados en el tamaño de la pantalla
function adjustUIForScreenSize() {
    const isMobile = isMobileDevice();
    const isSmallMobile = isSmallMobileDevice();
    
    // Ajustar el body
    document.body.classList.toggle('mobile-view', isMobile);
    document.body.classList.toggle('small-mobile-view', isSmallMobile);
    
    // Ajustar tablas para hacerlas responsivas
    makeTablesResponsive();
    
    // Ajustar tamaños de texto en tarjetas y paneles
    adjustFontSizes(isMobile, isSmallMobile);
    
    // Evento personalizado para notificar a otros scripts
    window.dispatchEvent(new CustomEvent('screen-size-changed', { 
        detail: { isMobile, isSmallMobile } 
    }));
}

// Hacer que todas las tablas sean responsivas
function makeTablesResponsive() {
    const tables = document.querySelectorAll('table:not(.table-responsive)');
    tables.forEach(table => {
        // Si la tabla no está ya en un contenedor responsivo
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// Ajustar tamaños de texto basados en el tamaño de pantalla
function adjustFontSizes(isMobile, isSmallMobile) {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const cardTitles = document.querySelectorAll('.card-title');
    const cardText = document.querySelectorAll('.card-text');
    
    if (isSmallMobile) {
        headings.forEach(heading => {
            heading.style.fontSize = heading.tagName === 'H1' ? '1.5rem' : 
                                    heading.tagName === 'H2' ? '1.3rem' : 
                                    heading.tagName === 'H3' ? '1.1rem' : '';
        });
        
        cardTitles.forEach(title => title.style.fontSize = '1rem');
        cardText.forEach(text => text.style.fontSize = '0.875rem');
    } else if (isMobile) {
        headings.forEach(heading => {
            heading.style.fontSize = heading.tagName === 'H1' ? '1.8rem' : 
                                    heading.tagName === 'H2' ? '1.5rem' : 
                                    heading.tagName === 'H3' ? '1.2rem' : '';
        });
        
        cardTitles.forEach(title => title.style.fontSize = '1.1rem');
        cardText.forEach(text => text.style.fontSize = '0.9rem');
    } else {
        // Restaurar tamaños predeterminados
        headings.forEach(heading => heading.style.fontSize = '');
        cardTitles.forEach(title => title.style.fontSize = '');
        cardText.forEach(text => text.style.fontSize = '');
    }
}

// Inicializar funciones de responsividad
function initResponsiveness() {
    // Ajustar UI inicialmente
    adjustUIForScreenSize();
    
    // Ajustar UI al cambiar tamaño de ventana
    window.addEventListener('resize', adjustUIForScreenSize);
    
    // Ajustar UI cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', adjustUIForScreenSize);
}

// Auto-inicializar
initResponsiveness();

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
    console.log(`Alerta: ${mensaje} (${tipo})`);
    
    try {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            console.error('No se encontró el contenedor de alertas. Creando uno temporal.');
            // Crear el contenedor si no existe
            const tempContainer = document.createElement('div');
            tempContainer.id = 'alertContainer';
            tempContainer.className = 'position-fixed top-0 end-0 p-3';
            tempContainer.style.zIndex = '1050';
            document.body.appendChild(tempContainer);
            
            // Usar el contenedor recién creado
            const alert = document.createElement('div');
            alert.className = `alert alert-${tipo} alert-dismissible fade show`;
            alert.role = 'alert';
            alert.innerHTML = `
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

            tempContainer.appendChild(alert);

            // Auto-cerrar después de 5 segundos
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }, 5000);
            
            return;
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertContainer.appendChild(alert);

        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
    } catch (error) {
        console.error('Error al mostrar alerta:', error);
        // Mostrar un alert nativo como último recurso
        if (tipo === 'danger' || tipo === 'error') {
            window.alert(`Error: ${mensaje}`);
        }
    }
}

// Exportar la función
window.mostrarAlerta = mostrarAlerta; 