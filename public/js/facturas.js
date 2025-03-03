// Array para almacenar las facturas
let facturas = [];

// Función para mostrar una factura nueva
function showInvoice(selectedServices, totalCost) {
    // Crear objeto de factura con fecha actual
    const factura = {
        id: Date.now(), // ID único basado en timestamp
        services: selectedServices,
        totalCost: totalCost,
        date: new Date().toLocaleDateString()
    };
    
    // Agregar la factura al array
    facturas.push(factura);
    
    // Mostrar todas las facturas
    displayFacturas();
    
    // Mostrar la sección de facturas
    showSection('facturas');
}

// Función para mostrar todas las facturas
function displayFacturas() {
    const facturasDatos = document.getElementById('facturasDatos');
    facturasDatos.innerHTML = ''; // Limpiar contenido anterior
    
    // Mensaje si no hay facturas
    if (facturas.length === 0) {
        facturasDatos.innerHTML = '<div class="alert alert-info">No hay facturas generadas.</div>';
        return;
    }
    
    // Crear contenedor principal
    const containerDiv = document.createElement('div');
    containerDiv.className = 'row';
    
    // Crear tarjetas para cada factura
    facturas.forEach((factura, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'col-md-6 mb-4';
        
        // Crear tarjeta con Bootstrap
        cardDiv.innerHTML = `
            <div class="card">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Factura #${index + 1}</h5>
                        <small>${factura.date}</small>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Servicio</th>
                                    <th>Cantidad</th>
                                    <th class="text-end">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${factura.services.map(service => `
                                <tr>
                                    <td>${service.name}</td>
                                    <td>${service.quantity}</td>
                                    <td class="text-end">$${(service.price * service.quantity).toFixed(2)}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colspan="2">Total</th>
                                    <th class="text-end">$${factura.totalCost.toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="d-flex justify-content-end gap-2 mt-3">
                        <button class="btn btn-warning" onclick="modifyFactura(${index})">
                            <i class="bi bi-pencil-square"></i> Modificar
                        </button>
                        <button class="btn btn-danger" onclick="deleteFactura(${index})">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        containerDiv.appendChild(cardDiv);
    });
    
    facturasDatos.appendChild(containerDiv);
}

// Función para modificar una factura existente
function modifyFactura(index) {
    const factura = facturas[index];
    
    // Cambiar a la sección de órdenes
    showSection('ordenes');
    
    // Asegurarse de que los servicios estén cargados
    loadServicesForOrders();
    
    // Esperar a que los servicios se carguen
    setTimeout(() => {
        // Limpiar selecciones anteriores
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Marcar los servicios de la factura
        factura.services.forEach(service => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox.getAttribute('data-nombre') === service.name) {
                    checkbox.checked = true;
                    
                    // Establecer la cantidad
                    const idServicio = checkbox.id.replace('servicio', '');
                    const cantidadInput = document.getElementById(`cantidad${idServicio}`);
                    if (cantidadInput) {
                        cantidadInput.value = service.quantity;
                    }
                }
            });
        });
        
        // Eliminar la factura anterior
        facturas.splice(index, 1);
        
        // Crear mensaje informativo
        const mensajeDiv = document.createElement('div');
        mensajeDiv.id = 'mensajeEdicion';
        mensajeDiv.className = 'alert alert-info mt-3';
        mensajeDiv.innerHTML = `
            <strong>Modo edición:</strong> 
            Está modificando una factura existente. 
            Ajuste los servicios y cantidades según necesite, 
            luego presione "Solicitar Servicios" para generar la factura actualizada.
        `;
        
        // Eliminar mensaje previo si existe
        const mensajeAnterior = document.getElementById('mensajeEdicion');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }
        
        // Agregar mensaje al formulario
        const ordenesForm = document.getElementById('ordenesForm');
        ordenesForm.insertBefore(mensajeDiv, ordenesForm.querySelector('button[type="submit"]'));
        
        // Hacer scroll al inicio del formulario
        ordenesForm.scrollIntoView({ behavior: 'smooth' });
    }, 600);
}

// Función para eliminar una factura
function deleteFactura(index) {
    if (confirm('¿Está seguro de que desea eliminar esta factura?')) {
        facturas.splice(index, 1);
        displayFacturas();
    }
}

// Almacenar facturas en localStorage cuando se cierra la página
window.addEventListener('beforeunload', () => {
    localStorage.setItem('facturas', JSON.stringify(facturas));
});

// Cargar facturas desde localStorage al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const facturasGuardadas = localStorage.getItem('facturas');
    if (facturasGuardadas) {
        facturas = JSON.parse(facturasGuardadas);
        displayFacturas(); // Mostrar las facturas guardadas
    }
});


//BORRA ESTE COMENTARIO