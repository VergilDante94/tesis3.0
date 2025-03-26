// Configuración de estados y sus transiciones permitidas
const ESTADOS_ORDEN = {
    PENDIENTE: {
        nombre: 'Pendiente',
        color: 'warning',
        transicionesPermitidas: ['PROGRAMADA', 'EN_PROCESO', 'CANCELADA']
    },
    PROGRAMADA: {
        nombre: 'Programada',
        color: 'info',
        transicionesPermitidas: ['EN_PROCESO', 'CANCELADA']
    },
    EN_PROCESO: {
        nombre: 'En Proceso',
        color: 'primary',
        transicionesPermitidas: ['COMPLETADA', 'CANCELADA']
    },
    COMPLETADA: {
        nombre: 'Completada',
        color: 'success',
        transicionesPermitidas: []
    },
    CANCELADA: {
        nombre: 'Cancelada',
        color: 'danger',
        transicionesPermitidas: []
    }
};

// Función para validar una transición de estado
function validarTransicionEstado(estadoActual, nuevoEstado) {
    const estadoConfig = ESTADOS_ORDEN[estadoActual];
    if (!estadoConfig) {
        throw new Error(`Estado actual inválido: ${estadoActual}`);
    }
    
    if (!ESTADOS_ORDEN[nuevoEstado]) {
        throw new Error(`Nuevo estado inválido: ${nuevoEstado}`);
    }
    
    if (!estadoConfig.transicionesPermitidas.includes(nuevoEstado)) {
        throw new Error(
            `No se puede cambiar de ${estadoConfig.nombre} a ${ESTADOS_ORDEN[nuevoEstado].nombre}. ` +
            `Transiciones permitidas: ${estadoConfig.transicionesPermitidas.map(e => ESTADOS_ORDEN[e].nombre).join(', ')}`
        );
    }
    
    return true;
}

// Función para obtener las transiciones permitidas para un estado
function obtenerTransicionesPermitidas(estadoActual) {
    const estadoConfig = ESTADOS_ORDEN[estadoActual];
    if (!estadoConfig) return [];
    
    return estadoConfig.transicionesPermitidas.map(estado => ({
        value: estado,
        label: ESTADOS_ORDEN[estado].nombre,
        color: ESTADOS_ORDEN[estado].color
    }));
}

// Función para obtener la clase de badge según el estado
function getEstadoBadgeClass(estado) {
    const estadoConfig = ESTADOS_ORDEN[estado];
    if (!estadoConfig) return 'bg-secondary text-white';
    return `bg-${estadoConfig.color} text-white`;
}

// Función para registrar un cambio de estado
async function registrarCambioEstado(ordenId, estadoAnterior, nuevoEstado, usuarioId) {
    // Por ahora, no registramos el historial ya que la ruta no existe
    console.log('Cambio de estado:', {
        ordenId,
        estadoAnterior,
        nuevoEstado,
        usuarioId,
        fecha: new Date()
    });
    return null;
}

// Función para actualizar el estado de una orden
async function actualizarEstado(ordenId, nuevoEstado) {
    try {
        // Obtener estado actual
        const response = await fetch(`/api/ordenes/${ordenId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el estado actual de la orden');
        }

        const orden = await response.json();
        
        // Validar transición
        validarTransicionEstado(orden.estado, nuevoEstado);
        
        // Realizar cambio
        const updateResponse = await fetch(`/api/ordenes/${ordenId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(error.message || 'Error al actualizar estado');
        }
        
        // Registrar el cambio en la consola (temporalmente)
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        await registrarCambioEstado(ordenId, orden.estado, nuevoEstado, usuario.id);
        
        return await updateResponse.json();
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        throw error;
    }
}

// Exportar las funciones y constantes
window.estadosOrden = {
    ESTADOS_ORDEN,
    validarTransicionEstado,
    obtenerTransicionesPermitidas,
    getEstadoBadgeClass,
    registrarCambioEstado,
    actualizarEstado
}; 