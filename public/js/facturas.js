// Eliminar el sistema local de facturas y mantener solo las funciones del backend
const facturasManager = {
    async generarFactura(ordenId) {
        try {
            const response = await fetch(`/api/facturas/orden/${ordenId}`, {
                method: 'POST',
                headers: auth.getHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al generar factura');
            }
            return await response.json();
        } catch (error) {
            console.error('Error al generar factura:', error);
            throw error;
        }
    },

    async obtenerFacturasCliente(clienteId) {
        try {
            console.log('Obteniendo facturas para cliente ID:', clienteId);
            const response = await fetch(`/api/facturas/cliente/${clienteId}`, {
                headers: auth.getHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al obtener facturas');
            }
            const facturas = await response.json();
            console.log('Facturas recibidas:', facturas);
            return facturas;
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            throw error;
        }
    },

    async obtenerTodasLasFacturas() {
        try {
            const response = await fetch('/api/facturas', {
                headers: auth.getHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al obtener facturas');
            }
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
        console.log('Iniciando mostrarListaFacturas...');
        
        // Obtener el elemento contenedor
        const facturasContainer = document.getElementById('facturasDatos');
        if (!facturasContainer) {
            console.error('No se encontró el contenedor de facturas');
            return;
        }
        console.log('Contenedor de facturas encontrado:', facturasContainer);

        // Mostrar indicador de carga
        facturasContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando facturas...</span>
                </div>
            </div>
        `;

        // Obtener las facturas
        let facturas;
        const usuarioInfo = window.getUserInfo();
        console.log('Información del usuario:', usuarioInfo);
        
        if (!usuarioInfo) {
            console.error('No se pudo obtener la información del usuario');
            facturasContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Error: No se pudo obtener la información del usuario
                    </div>
                </div>
            `;
            return;
        }
        
        try {
            if (usuarioInfo.tipo === 'CLIENTE') {
                console.log('Obteniendo facturas para cliente:', usuarioInfo.id);
                // Si es cliente, obtener solo sus facturas
                facturas = await facturasManager.obtenerFacturasCliente(usuarioInfo.id);
            } else {
                console.log('Obteniendo todas las facturas');
                // Si es admin o trabajador, obtener todas
                facturas = await facturasManager.obtenerTodasLasFacturas();
            }
            console.log('Respuesta del servidor:', facturas);
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            facturasContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Error al cargar las facturas: ${error.message}
                    </div>
                </div>
            `;
            return;
        }
        
        // Limpiar el contenedor
        facturasContainer.innerHTML = '';
        
        if (!facturas || facturas.length === 0) {
            console.log('No hay facturas disponibles');
            facturasContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> No hay facturas disponibles
                    </div>
                </div>
            `;
            return;
        }

        // Crear el contenedor de la tabla
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';
        
        // Crear la tabla
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Crear el encabezado de la tabla
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${facturas.map(factura => `
                    <tr>
                        <td>${factura.id}</td>
                        <td>#${factura.ordenId}</td>
                        <td>${factura.orden?.cliente?.usuario?.nombre || 'N/A'}</td>
                        <td>${new Date(factura.fechaEmision).toLocaleDateString()}</td>
                        <td>$${factura.total.toFixed(2)}</td>
                        <td>
                            <span class="badge bg-${factura.estado === 'PENDIENTE' ? 'warning' : 'success'}">
                                ${factura.estado}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-primary" onclick="descargarFactura(${factura.id})">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-sm btn-info" onclick="imprimirFactura(${factura.id})">
                                    <i class="fas fa-print"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        tableContainer.appendChild(table);
        facturasContainer.appendChild(tableContainer);
        
        console.log('Tabla de facturas creada exitosamente');
        
    } catch (error) {
        console.error('Error al mostrar facturas:', error);
        const facturasContainer = document.getElementById('facturasDatos');
        if (facturasContainer) {
            facturasContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Error al cargar las facturas: ${error.message}
                    </div>
                </div>
            `;
        }
    }
}

// Función para descargar factura en PDF
async function descargarFactura(facturaId) {
    try {
        // Mostrar indicador de carga
        mostrarAlerta('Generando PDF, por favor espere...', 'info');
        
        // Verificar que el usuario esté autenticado
        const usuarioInfo = window.getUserInfo();
        if (!usuarioInfo) {
            throw new Error('No hay sesión activa');
        }

        console.log('Iniciando descarga de factura:', facturaId);
        
        // Solicitar el PDF al servidor usando auth.getHeaders()
        const response = await fetch(`/api/facturas/${facturaId}/pdf`, {
            method: 'GET',
            headers: auth.getHeaders(),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en la respuesta del servidor:', errorData);
            throw new Error(errorData.error || `Error al generar PDF: ${response.status}`);
        }
        
        // Verificar el tipo de contenido
        const contentType = response.headers.get('content-type');
        console.log('Tipo de contenido recibido:', contentType);
        
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('La respuesta no es un PDF válido');
        }
        
        // Convertir la respuesta a blob
        const blob = await response.blob();
        console.log('Blob creado:', blob.size, 'bytes');
        
        // Crear URL para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Obtener la fecha actual para el nombre del archivo
        const fecha = new Date().toISOString().split('T')[0];
        a.download = `factura-${facturaId}-${fecha}.pdf`;
        
        // Añadir al documento y hacer clic
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        mostrarAlerta('PDF descargado correctamente', 'success');
    } catch (error) {
        console.error('Error al descargar factura:', error);
        mostrarAlerta(`Error al descargar factura: ${error.message}`, 'danger');
    }
}

// Función para imprimir la factura
function imprimirFactura(facturaId) {
    // Crear una ventana de impresión
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        mostrarAlerta('Por favor, permite las ventanas emergentes para imprimir', 'warning');
        return;
    }
    
    // Obtener la factura del DOM
    const facturaElement = document.querySelector(`.card:has(h5:contains("Factura #${facturaId}"))`);
    if (!facturaElement) {
        mostrarAlerta('No se pudo encontrar la factura para imprimir', 'danger');
        printWindow.close();
        return;
    }
    
    // Clonar el contenido para no modificar el original
    const facturaClone = facturaElement.cloneNode(true);
    
    // Preparar el contenido HTML para impresión
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Factura #${facturaId} - EICMAPRI</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .print-footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 0.8rem;
                    color: #6c757d;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>EICMAPRI</h2>
                <p>Servicios Tecnológicos</p>
            </div>
            <div class="container">
                ${facturaClone.outerHTML}
            </div>
            <div class="print-footer">
                <p>Este documento es una representación impresa de la factura electrónica.</p>
                <p>Fecha de impresión: ${new Date().toLocaleString()}</p>
            </div>
            <script>
                // Ocultar botones que no deben imprimirse
                document.querySelectorAll('.btn').forEach(btn => {
                    btn.classList.add('no-print');
                });
                
                // Imprimir automáticamente
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertaDiv.style.zIndex = '9999';
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertaDiv);
    
    setTimeout(() => {
        alertaDiv.remove();
    }, 3000);
}

// Inicializar módulo de facturas
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de facturas...');
    
    // Verificar si existe la función showSection (definida en script.js)
    if (typeof window.showSection === 'function') {
        // Buscar todos los enlaces que llevan a la sección de facturas
        document.querySelectorAll('a[data-section="facturas"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Enlace de facturas clickeado');
                window.showSection('facturas');
                mostrarListaFacturas(); // Cargar las facturas
            });
        });
    } else {
        console.error('No se encontró la función showSection');
    }
    
    // Exportar funciones al objeto global
    window.mostrarListaFacturas = mostrarListaFacturas;
    window.descargarFactura = descargarFactura;
    window.imprimirFactura = imprimirFactura;
    
    // Exponer el módulo de facturas
    window.facturasManager = facturasManager;
    
    console.log('Módulo de facturas inicializado correctamente');
});