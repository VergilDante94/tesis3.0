// Funciones para manejar JWT en el frontend
// Nota: jsonwebtoken se usa en el backend para verificar tokens. 
// En el frontend usamos decodificación simple sin verificación de firma.

/**
 * Decodifica un JWT sin verificar la firma (solo para uso en frontend)
 * @param {string} token - El token JWT a decodificar
 * @returns {object|null} - El payload decodificado o null si hay error
 */
function decodeJWT(token) {
    try {
        if (!token) return null;
        
        // Dividir el token en sus partes
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // Decodificar el payload (segunda parte)
        const payload = parts[1];
        
        // Agregar padding si es necesario
        const pad = payload.length % 4;
        const base64 = pad ? payload + '='.repeat(4 - pad) : payload;
        
        // Reemplazar caracteres para base64url y decodificar
        const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        
        // Convertir a UTF-8
        const utf8 = decodeURIComponent(
            decoded.split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );

        return JSON.parse(utf8);
    } catch (error) {
        console.error('Error decodificando token:', error);
        return null;
    }
}

/**
 * Obtiene la información completa del usuario desde el token
 * @returns {object|null} - Información del usuario o null
 */
function getUserInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        return decodeJWT(token);
    } catch (error) {
        console.error('Error obteniendo información de usuario:', error);
        return null;
    }
}

/**
 * Obtiene el tipo/rol del usuario desde el token
 * @returns {string|null} - Tipo de usuario o null
 */
function getUserType() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const decoded = decodeJWT(token);
        return decoded ? decoded.tipo : null;
    } catch (error) {
        console.error('Error obteniendo tipo de usuario:', error);
        return null;
    }
}

/**
 * Obtiene el ID del usuario desde el token
 * @returns {number|null} - ID del usuario o null
 */
function getUserId() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const decoded = decodeJWT(token);
        return decoded ? decoded.id : null;
    } catch (error) {
        console.error('Error obteniendo ID de usuario:', error);
        return null;
    }
}

/**
 * Refresca la información del usuario desde el backend
 * @returns {Promise<object|null>} - Promesa con la información actualizada
 */
async function refreshUserInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const response = await fetch('/api/usuarios/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token inválido o expirado
                localStorage.removeItem('token');
                localStorage.removeItem('user_data');
                window.location.href = '/login.html';
            }
            throw new Error('Error al obtener información del usuario');
        }
        
        const userData = await response.json();
        localStorage.setItem('user_data', JSON.stringify(userData));
        return userData;
    } catch (error) {
        console.error('Error al refrescar información del usuario:', error);
        return null;
    }
}

// Exponer las funciones globalmente
window.decodeJWT = decodeJWT;
window.getUserType = getUserType;
window.getUserId = getUserId;
window.getUserInfo = getUserInfo;
window.refreshUserInfo = refreshUserInfo; 