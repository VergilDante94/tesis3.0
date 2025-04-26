/**
 * Utilidad para manejo de logs de la aplicación
 */

// Función para logs informativos
const logInfo = (message, data) => {
    console.log(`INFO: ${message}`, data || '');
};

// Función para logs de error
const logError = (message, error) => {
    console.error(`ERROR: ${message}`, error || '');
};

module.exports = {
    logInfo,
    logError
}; 