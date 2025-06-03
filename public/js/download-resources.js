// Script para descargar recursos faltantes
const resources = {
    fonts: [
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-solid-900.woff',
            path: '/css/webfonts/fa-solid-900.woff'
        },
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-solid-900.ttf',
            path: '/css/webfonts/fa-solid-900.ttf'
        }
    ]
};

async function checkFileExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.log(`Archivo no encontrado: ${path}`);
        return false;
    }
}

async function downloadResource(url, path) {
    try {
        // Verificar si el archivo ya existe
        const exists = await checkFileExists(path);
        if (exists) {
            console.log(`El archivo ya existe: ${path}`);
            return;
        }

        console.log(`Descargando: ${path}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        
        // Crear un enlace temporal para descargar el archivo
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = path.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        
        console.log(`Recurso descargado: ${path}`);
    } catch (error) {
        console.error(`Error al descargar ${path}:`, error);
    }
}

// Función para descargar todos los recursos
async function downloadAllResources() {
    console.log('Verificando recursos faltantes...');
    
    // Solo descargar fuentes faltantes
    for (const resource of resources.fonts) {
        await downloadResource(resource.url, resource.path);
    }
    
    console.log('Verificación de recursos completada');
}

// Exponer la función globalmente
window.downloadAllResources = downloadAllResources;

// Nota: Los archivos .map son opcionales y solo se usan para depuración
// No es necesario descargarlos para el funcionamiento normal de la aplicación 