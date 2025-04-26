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

/**
 * Funciones de utilidad para manejar notificaciones en la aplicación
 */

const notificacionesUtils = {
    /**
     * Crea una notificación para un usuario específico
     * @param {number} usuarioId - ID del usuario destinatario
     * @param {string} tipo - Tipo de notificación (ORDEN, FACTURA, etc.)
     * @param {string} mensaje - Mensaje de la notificación
     * @param {number} enlaceId - ID opcional para enlazar a un recurso
     * @param {string} enlaceTipo - Tipo de enlace (ORDEN, FACTURA, etc.)
     * @returns {Promise<Object>} - La notificación creada
     */
    async crearNotificacion(usuarioId, tipo, mensaje, enlaceId = null, enlaceTipo = null) {
        try {
            const response = await fetch('/api/notificaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getHeaders()
                },
                body: JSON.stringify({
                    usuarioId,
                    tipo,
                    mensaje,
                    enlaceId,
                    enlaceTipo
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al crear notificación:', error);
            throw error;
        }
    },
    
    /**
     * Notifica a todos los administradores
     * @param {string} tipo - Tipo de notificación
     * @param {string} mensaje - Mensaje de la notificación
     * @param {number} enlaceId - ID opcional para enlazar a un recurso
     * @param {string} enlaceTipo - Tipo de enlace
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    async notificarAdministradores(tipo, mensaje, enlaceId = null, enlaceTipo = null) {
        try {
            const response = await fetch('/api/notificaciones/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getHeaders()
                },
                body: JSON.stringify({
                    tipo,
                    mensaje,
                    enlaceId,
                    enlaceTipo
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al notificar administradores:', error);
            throw error;
        }
    },
    
    /**
     * Genera notificaciones para eventos de órdenes
     * @param {Object} orden - Datos de la orden
     * @param {string} accion - Acción realizada (CREAR, ACTUALIZAR, CANCELAR)
     * @param {Object} usuario - Usuario que realiza la acción
     */
    async notificarEventoOrden(orden, accion, usuario) {
        try {
            let tipo = 'ORDEN';
            let mensaje = '';
            
            switch (accion) {
                case 'CREAR':
                    mensaje = `Se ha creado una nueva orden #${orden.id} por el cliente ${orden.cliente.usuario.nombre}`;
                    break;
                case 'ACTUALIZAR':
                    mensaje = `La orden #${orden.id} ha sido actualizada. Nuevo estado: ${orden.estado}`;
                    break;
                case 'CANCELAR':
                    mensaje = `La orden #${orden.id} ha sido cancelada por ${usuario.nombre}`;
                    break;
                case 'COMPLETAR':
                    mensaje = `La orden #${orden.id} ha sido completada`;
                    break;
                default:
                    mensaje = `Actualización en la orden #${orden.id}`;
            }
            
            // Notificar a los administradores
            await this.notificarAdministradores(tipo, mensaje, orden.id, 'ORDEN');
            
            // Notificar al cliente si no es el que realizó la acción
            if (usuario.id !== orden.cliente.usuarioId && accion !== 'CREAR') {
                await this.crearNotificacion(
                    orden.cliente.usuarioId,
                    tipo,
                    mensaje,
                    orden.id,
                    'ORDEN'
                );
            }
        } catch (error) {
            console.error('Error al notificar evento de orden:', error);
        }
    },
    
    /**
     * Genera notificaciones para eventos de facturas
     * @param {Object} factura - Datos de la factura
     * @param {string} accion - Acción realizada (CREAR, ACTUALIZAR, PAGAR)
     * @param {Object} orden - Orden asociada a la factura
     */
    async notificarEventoFactura(factura, accion, orden) {
        try {
            let tipo = 'FACTURA';
            let mensaje = '';
            
            switch (accion) {
                case 'CREAR':
                    mensaje = `Se ha generado una nueva factura #${factura.id} para la orden #${orden.id}`;
                    break;
                case 'ACTUALIZAR':
                    mensaje = `La factura #${factura.id} ha sido actualizada. Nuevo estado: ${factura.estado}`;
                    break;
                case 'PAGAR':
                    mensaje = `La factura #${factura.id} ha sido pagada. Total: $${factura.total.toFixed(2)}`;
                    break;
                default:
                    mensaje = `Actualización en la factura #${factura.id}`;
            }
            
            // Notificar a los administradores
            await this.notificarAdministradores(tipo, mensaje, factura.id, 'FACTURA');
            
            // Notificar al cliente
            await this.crearNotificacion(
                orden.cliente.usuarioId,
                tipo,
                mensaje,
                factura.id,
                'FACTURA'
            );
        } catch (error) {
            console.error('Error al notificar evento de factura:', error);
        }
    },
    
    /**
     * Genera notificaciones para eventos de stock (productos con bajo stock)
     * @param {Object} producto - Datos del producto
     * @param {number} cantidad - Cantidad actual en stock
     */
    async notificarStockBajo(producto, cantidad) {
        try {
            if (cantidad <= producto.stock.minimo) {
                const tipo = 'PRODUCTO';
                const mensaje = `¡Alerta de stock bajo! El producto "${producto.nombre}" tiene solo ${cantidad} unidades disponibles (mínimo: ${producto.stock.minimo})`;
                
                // Solo notificar a administradores
                await this.notificarAdministradores(tipo, mensaje, producto.id, 'PRODUCTO');
            }
        } catch (error) {
            console.error('Error al notificar stock bajo:', error);
        }
    },
    
    /**
     * Genera notificaciones de sistema para todos los usuarios
     * @param {string} mensaje - Mensaje de la notificación
     * @param {Array<number>} usuariosIds - IDs de usuarios a notificar (si no se especifica, se notifica a todos)
     */
    async notificarSistema(mensaje, usuariosIds = null) {
        try {
            const tipo = 'SISTEMA';
            
            if (usuariosIds && Array.isArray(usuariosIds)) {
                // Notificar solo a usuarios específicos
                for (const usuarioId of usuariosIds) {
                    await this.crearNotificacion(usuarioId, tipo, mensaje);
                }
            } else {
                // Notificar a todos los administradores
                await this.notificarAdministradores(tipo, mensaje);
            }
        } catch (error) {
            console.error('Error al enviar notificación de sistema:', error);
        }
    }
};

// Exponer el objeto notificacionesUtils globalmente
window.notificacionesUtils = notificacionesUtils; 