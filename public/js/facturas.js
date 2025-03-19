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

const facturasManager = {
    async generarFactura(ordenId) {
        try {
            const response = await fetch(`/api/facturas/orden/${ordenId}`, {
                method: 'POST',
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al generar factura:', error);
            throw error;
        }
    },

    async obtenerFacturasCliente(clienteId) {
        try {
            const response = await fetch(`/api/facturas/cliente/${clienteId}`, {
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            throw error;
        }
    }
};

// Función para mostrar lista de facturas
async function mostrarListaFacturas() {
    try {
        // Obtener el elemento contenedor
        const facturasContainer = document.getElementById('facturasDatos');
        facturasContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando facturas...</span>
                </div>
            </div>
        `;

        // Obtener las facturas
        let response;
        try {
            const usuarioInfo = window.getUserInfo();
            if (usuarioInfo.tipo === 'CLIENTE') {
                // Si es cliente, obtener solo sus facturas
                response = await fetch(`/api/facturas/cliente/${usuarioInfo.perfilId}`, {
                    headers: auth.getHeaders()
                });
            } else {
                // Si es admin o trabajador, obtener todas
                response = await fetch('/api/facturas', {
                    headers: auth.getHeaders()
                });
            }
            
            if (!response.ok) {
                throw new Error('Error al cargar facturas');
            }
        } catch (error) {
            console.error('Error al solicitar facturas:', error);
            facturasContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> No se pudieron cargar las facturas: ${error.message}
                    </div>
                </div>
            `;
            return;
        }

        const facturas = await response.json();
        
        // Si no hay facturas
        if (!facturas || facturas.length === 0) {
            facturasContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> No hay facturas disponibles.
                    </div>
                </div>
            `;
            return;
        }

        // Mostrar las facturas en un diseño de tarjetas
        const facturasHTML = facturas.map(factura => {
            // Formatear fecha
            const fecha = new Date(factura.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // Calcular IVA (16%)
            const iva = factura.subtotal * 0.16;
            
            // Construir el HTML para los servicios
            const serviciosHTML = factura.orden.servicios.map(s => {
                const servicio = s.servicio;
                const cantidad = s.cantidad;
                const precioUnitario = servicio.precioBase;
                const total = precioUnitario * cantidad;
                
                return `
                    <tr>
                        <td>${servicio.nombre}</td>
                        <td>${servicio.tipo === 'POR_HORA' ? 'Por hora' : 'Por cantidad'}</td>
                        <td class="text-center">${cantidad}</td>
                        <td class="text-end">$${precioUnitario.toLocaleString('es-CO')}</td>
                        <td class="text-end">$${total.toLocaleString('es-CO')}</td>
                    </tr>
                `;
            }).join('');
            
            // Datos del cliente
            const cliente = factura.orden.cliente?.usuario?.nombre || 'Cliente no disponible';
            
            return `
                <div class="col-md-12 mb-4">
                    <div class="card shadow-sm">
                        <div class="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-file-invoice-dollar me-2"></i>
                                Factura #${factura.id}
                            </h5>
                            <div class="badge bg-primary">
                                <i class="fas fa-calendar-alt me-1"></i> ${fechaFormateada}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6 class="card-subtitle mb-2 text-muted">Información del Cliente</h6>
                                    <p class="mb-1"><strong>Cliente:</strong> ${cliente}</p>
                                    <p class="mb-1"><strong>Orden:</strong> #${factura.orden.id}</p>
                                    <p class="mb-0"><strong>Fecha de Orden:</strong> ${new Date(factura.orden.fechaCreacion).toLocaleDateString('es-ES')}</p>
                                </div>
                                <div class="col-md-6 text-md-end">
                                    <h6 class="card-subtitle mb-2 text-muted">Información de la Factura</h6>
                                    <p class="mb-1"><strong>Estado:</strong> <span class="badge bg-success">Pagada</span></p>
                                    <p class="mb-1"><strong>Método de Pago:</strong> Pendiente</p>
                                    <p class="mb-0"><strong>Fecha de Vencimiento:</strong> ${new Date(fecha.getTime() + 30*24*60*60*1000).toLocaleDateString('es-ES')}</p>
                                </div>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-sm table-striped">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Servicio</th>
                                            <th>Tipo</th>
                                            <th class="text-center">Cantidad</th>
                                            <th class="text-end">Precio Unitario</th>
                                            <th class="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${serviciosHTML}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="4" class="text-end">Subtotal:</th>
                                            <th class="text-end">$${factura.subtotal.toLocaleString('es-CO')}</th>
                                        </tr>
                                        <tr>
                                            <td colspan="4" class="text-end">IVA (16%):</td>
                                            <td class="text-end">$${iva.toLocaleString('es-CO')}</td>
                                        </tr>
                                        <tr class="table-primary">
                                            <th colspan="4" class="text-end">TOTAL:</th>
                                            <th class="text-end">$${factura.total.toLocaleString('es-CO')}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            
                            <div class="mt-3 text-end">
                                <button class="btn btn-primary" onclick="descargarFactura(${factura.id})">
                                    <i class="fas fa-download me-1"></i> Descargar PDF
                                </button>
                            </div>
                        </div>
                        <div class="card-footer text-muted">
                            <small>
                                <i class="fas fa-info-circle me-1"></i>
                                Esta factura fue generada automáticamente al crear la orden de trabajo.
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Actualizar el contenedor
        facturasContainer.innerHTML = `
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Las facturas se generan automáticamente al crear órdenes de trabajo. 
                        Puede descargarlas en formato PDF haciendo clic en el botón correspondiente.
                    </div>
                </div>
                ${facturasHTML}
            </div>
        `;
        
    } catch (error) {
        console.error('Error al mostrar facturas:', error);
        const facturasContainer = document.getElementById('facturasDatos');
        facturasContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Error al procesar las facturas: ${error.message}
                </div>
            </div>
        `;
    }
}

// Función para descargar factura en PDF
async function descargarFactura(facturaId) {
    // Mostrar indicador de carga
    const btnDescargar = document.querySelector(`button[onclick="descargarFactura(${facturaId})"]`);
    const btnTextoOriginal = btnDescargar.innerHTML;
    
    try {
        btnDescargar.disabled = true;
        btnDescargar.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Generando PDF...
        `;

        const response = await fetch(`/api/facturas/${facturaId}/pdf`, {
            headers: auth.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Convertir la respuesta a blob
        const blob = await response.blob();
        
        // Crear URL para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento <a> temporal
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${facturaId}.pdf`;
        
        // Añadir al DOM, hacer clic y eliminar
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Factura descargada correctamente', 'success');
    } catch (error) {
        console.error('Error al descargar factura:', error);
        mostrarAlerta(`Error al descargar la factura: ${error.message}`, 'danger');
    } finally {
        // Restaurar botón
        btnDescargar.disabled = false;
        btnDescargar.innerHTML = btnTextoOriginal;
    }
}

// Inicializar módulo de facturas
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe la función showSection (definida en script.js)
    if (typeof window.showSection === 'function') {
        // Buscar todos los enlaces que llevan a la sección de facturas
        document.querySelectorAll('a[data-section="facturas"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.showSection('facturas');
                mostrarListaFacturas(); // Cargar las facturas
            });
        });
    }
    
    // Exportar funciones al objeto global
    window.mostrarListaFacturas = mostrarListaFacturas;
    window.descargarFactura = descargarFactura;
    
    // Exponer el módulo de facturas
    window.facturasManager = facturasManager;
});

// Función para mostrar alertas al usuario
function mostrarAlerta(mensaje, tipo) {
    // Verificar si ya existe una función global para mostrar alertas
    if (typeof window.mostrarAlerta === 'function') {
        window.mostrarAlerta(mensaje, tipo);
        return;
    }

    // Si no existe, crear una propia
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertaDiv.role = 'alert';
    alertaDiv.style.zIndex = '9999';
    
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertaDiv);
    
    // Eliminar automáticamente después de 3 segundos
    setTimeout(() => {
        if (document.body.contains(alertaDiv)) {
            alertaDiv.classList.remove('show');
            setTimeout(() => alertaDiv.remove(), 300);
        }
    }, 3000);
}