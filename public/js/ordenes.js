const ordenesManager = {
    async crearOrden(datos) {
        try {
            const response = await fetch('/api/ordenes', {
                method: 'POST',
                headers: auth.getHeaders(),
                body: JSON.stringify(datos)
            });
            return await response.json();
        } catch (error) {
            console.error('Error al crear orden:', error);
            throw error;
        }
    },

    async listarOrdenes(filtros = {}) {
        try {
            const queryParams = new URLSearchParams(filtros);
            const response = await fetch(`/api/ordenes?${queryParams}`, {
                headers: auth.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error al listar órdenes:', error);
            throw error;
        }
    },

    async actualizarEstado(ordenId, estado) {
        try {
            const response = await fetch(`/api/ordenes/${ordenId}/estado`, {
                method: 'PUT',
                headers: auth.getHeaders(),
                body: JSON.stringify({ estado })
            });
            return await response.json();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            throw error;
        }
    }
};

// Funciones para la UI de órdenes
function mostrarFormularioOrden() {
    const serviciosSeleccionados = [];
    let total = 0;

    async function cargarServicios() {
        try {
            const response = await fetch('/api/servicios');
            const servicios = await response.json();
            const serviciosContainer = document.getElementById('serviciosDisponibles');
            
            serviciosContainer.innerHTML = servicios.map(servicio => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${servicio.nombre}</h5>
                        <p class="card-text">${servicio.descripcion}</p>
                        <p class="card-text">Precio: $${servicio.precioBase}</p>
                        <div class="form-group">
                            <label>Cantidad:</label>
                            <input type="number" min="1" value="1" class="form-control cantidad-servicio" 
                                   data-servicio-id="${servicio.id}" data-precio="${servicio.precioBase}">
                        </div>
                        <button class="btn btn-primary agregar-servicio" data-servicio-id="${servicio.id}">
                            Agregar
                        </button>
                    </div>
                </div>
            `).join('');

            // Eventos para agregar servicios
            document.querySelectorAll('.agregar-servicio').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const servicioId = e.target.dataset.servicioId;
                    const cantidad = document.querySelector(`input[data-servicio-id="${servicioId}"]`).value;
                    const servicio = servicios.find(s => s.id === parseInt(servicioId));
                    
                    serviciosSeleccionados.push({
                        servicioId: parseInt(servicioId),
                        cantidad: parseInt(cantidad),
                        nombre: servicio.nombre,
                        precio: servicio.precioBase
                    });

                    actualizarResumen();
                });
            });
        } catch (error) {
            console.error('Error al cargar servicios:', error);
        }
    }

    function actualizarResumen() {
        const resumenContainer = document.getElementById('resumenOrden');
        total = serviciosSeleccionados.reduce((sum, s) => sum + (s.precio * s.cantidad), 0);

        resumenContainer.innerHTML = `
            <h4>Resumen de la Orden</h4>
            <ul class="list-group">
                ${serviciosSeleccionados.map(s => `
                    <li class="list-group-item">
                        ${s.nombre} x ${s.cantidad} = $${s.precio * s.cantidad}
                        <button class="btn btn-sm btn-danger float-end eliminar-servicio" 
                                data-servicio-id="${s.servicioId}">Eliminar</button>
                    </li>
                `).join('')}
            </ul>
            <div class="mt-3">
                <h5>Total: $${total}</h5>
            </div>
        `;

        // Eventos para eliminar servicios
        document.querySelectorAll('.eliminar-servicio').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const servicioId = parseInt(e.target.dataset.servicioId);
                const index = serviciosSeleccionados.findIndex(s => s.servicioId === servicioId);
                if (index > -1) {
                    serviciosSeleccionados.splice(index, 1);
                    actualizarResumen();
                }
            });
        });
    }

    // Cargar servicios al mostrar el formulario
    cargarServicios();
}

// Función para mostrar lista de órdenes
async function mostrarListaOrdenes() {
    try {
        const ordenes = await ordenesManager.listarOrdenes();
        const ordenesContainer = document.getElementById('listaOrdenes');
        
        ordenesContainer.innerHTML = ordenes.map(orden => `
            <div class="card mb-3">
                <div class="card-header">
                    Orden #${orden.id} - ${orden.estado}
                </div>
                <div class="card-body">
                    <h5 class="card-title">Cliente: ${orden.cliente.usuario.nombre}</h5>
                    <p class="card-text">Fecha: ${new Date(orden.fechaCreacion).toLocaleDateString()}</p>
                    <div class="servicios-lista">
                        <h6>Servicios:</h6>
                        <ul class="list-group">
                            ${orden.servicios.map(s => `
                                <li class="list-group-item">
                                    ${s.servicio.nombre} x ${s.cantidad}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ${auth.usuario.tipoUsuario === 'TRABAJADOR' ? `
                        <div class="mt-3">
                            <select class="form-select estado-orden" data-orden-id="${orden.id}">
                                <option value="SOLICITADA" ${orden.estado === 'SOLICITADA' ? 'selected' : ''}>Solicitada</option>
                                <option value="PROGRAMADA" ${orden.estado === 'PROGRAMADA' ? 'selected' : ''}>Programada</option>
                                <option value="EN_PROCESO" ${orden.estado === 'EN_PROCESO' ? 'selected' : ''}>En Proceso</option>
                                <option value="COMPLETADA" ${orden.estado === 'COMPLETADA' ? 'selected' : ''}>Completada</option>
                                <option value="CANCELADA" ${orden.estado === 'CANCELADA' ? 'selected' : ''}>Cancelada</option>
                            </select>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Eventos para cambio de estado
        if (auth.usuario.tipoUsuario === 'TRABAJADOR') {
            document.querySelectorAll('.estado-orden').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const ordenId = e.target.dataset.ordenId;
                    const nuevoEstado = e.target.value;
                    try {
                        await ordenesManager.actualizarEstado(ordenId, nuevoEstado);
                        mostrarListaOrdenes(); // Recargar lista
                    } catch (error) {
                        console.error('Error al actualizar estado:', error);
                        alert('Error al actualizar el estado de la orden');
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error al mostrar órdenes:', error);
    }
}