async function actualizarStock(productoId, cantidad) {
    // ... existing code ...
    try {
        // ... existing code ...
        const producto = await response.json();
        
        // Verificar si el stock está bajo y notificar
        if (window.notificacionesUtils && producto.stock) {
            notificacionesUtils.notificarStockBajo(producto, producto.stock.cantidad);
        }
        
        // ... rest of existing code ...
    } catch (error) {
        // ... existing code ...
    }
} 