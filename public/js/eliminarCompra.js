// Script para eliminar la compra (orden #19)
async function eliminarCompra() {
    try {
        const ordenId = 19; // ID de la compra a eliminar
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No hay sesión activa');
            alert('No hay sesión activa. Por favor inicie sesión.');
            return;
        }

        console.log('Eliminando orden #19...');
        
        // Realizar la petición al servidor
        const response = await fetch(`/api/ordenes/${ordenId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Orden eliminada con éxito:', data);
        alert('La compra ha sido eliminada con éxito');
        
        // Recargar la página si estamos en la sección de órdenes
        if (window.location.pathname.includes('ordenes')) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error al eliminar la compra:', error);
        alert(`Error al eliminar la compra: ${error.message}`);
    }
}

// Ejecutar la función al cargar el script
eliminarCompra(); 