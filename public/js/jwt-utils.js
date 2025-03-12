// Función para decodificar el token JWT
function decodeJWT(token) {
    try {
        if (!token) return null;
        
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Token JWT inválido');
        }
        
        // Decodificar la parte del payload (segunda parte)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error al decodificar token JWT:', error);
        return null;
    }
}

// Función para obtener el tipo de usuario del token
function getUserType() {
    const token = localStorage.getItem('token');
    const decoded = decodeJWT(token);
    return decoded ? decoded.tipo : null;
}

// Función para obtener el ID del usuario del token
function getUserId() {
    const token = localStorage.getItem('token');
    const decoded = decodeJWT(token);
    return decoded ? decoded.id : null;
}

// Función para obtener toda la información del usuario del token
function getUserInfo() {
    const token = localStorage.getItem('token');
    return decodeJWT(token);
}

// Exportar las funciones
window.decodeJWT = decodeJWT;
window.getUserType = getUserType;
window.getUserId = getUserId;
window.getUserInfo = getUserInfo; 