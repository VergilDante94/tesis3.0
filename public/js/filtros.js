/**
 * Módulo de filtros para servicios
 * Este archivo contiene funciones reutilizables para filtrar servicios
 * en diferentes secciones de la aplicación.
 */

// Función para crear el HTML del componente de filtro
function crearComponenteFiltro() {
    return `
        <div class="col-12 mb-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title mb-3">
                        <i class="fas fa-filter"></i> Filtrar Servicios
                    </h5>
                    
                    <div class="mb-3">
                        <label for="buscarServicio" class="form-label">Buscar por nombre o descripción</label>
                        <div class="input-group">
                            <span class="input-group-text bg-primary text-white">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" id="buscarServicio" class="form-control" 
                                   placeholder="Ej: Mantenimiento, Reparación..."
                                   style="background-color: #ffffff; color: #212529;">
                        </div>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="filtroTipo" class="form-label">Tipo de servicio</label>
                            <select id="filtroTipo" class="form-select" style="background-color: #ffffff; color: #212529;">
                                <option value="">Todos los tipos</option>
                                <option value="POR_HORA">Por Hora</option>
                                <option value="POR_CANTIDAD">Por Cantidad</option>
                            </select>
                        </div>
                        
                        <div class="col-md-4">
                            <label for="filtroPrecioMin" class="form-label">Precio mínimo</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" id="filtroPrecioMin" class="form-control" 
                                       placeholder="Desde" min="0" step="1000"
                                       style="background-color: #ffffff; color: #212529;">
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <label for="filtroPrecioMax" class="form-label">Precio máximo</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" id="filtroPrecioMax" class="form-control" 
                                       placeholder="Hasta" min="0" step="1000"
                                       style="background-color: #ffffff; color: #212529;">
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-end mt-3">
                        <button id="limpiarFiltros" class="btn btn-outline-secondary me-2">
                            <i class="fas fa-eraser"></i> Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para configurar los eventos de filtrado
function configurarFiltros(contenedorSelector, itemSelector) {
    const buscarServicioInput = document.getElementById('buscarServicio');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroPrecioMin = document.getElementById('filtroPrecioMin');
    const filtroPrecioMax = document.getElementById('filtroPrecioMax');
    const limpiarFiltros = document.getElementById('limpiarFiltros');

    // Función para aplicar todos los filtros
    function aplicarFiltros() {
        const busqueda = buscarServicioInput ? buscarServicioInput.value.toLowerCase().trim() : '';
        const tipoSeleccionado = filtroTipo ? filtroTipo.value : '';
        const precioMin = filtroPrecioMin && filtroPrecioMin.value ? parseFloat(filtroPrecioMin.value) : 0;
        const precioMax = filtroPrecioMax && filtroPrecioMax.value ? parseFloat(filtroPrecioMax.value) : Number.MAX_SAFE_INTEGER;
        
        const serviciosItems = document.querySelectorAll(itemSelector);
        let serviciosVisibles = 0;
        
        serviciosItems.forEach(item => {
            const nombre = item.querySelector('.card-title').textContent.toLowerCase();
            const descripcion = item.querySelector('.card-text').textContent.toLowerCase();
            const tipo = item.getAttribute('data-tipo') || '';
            const precioEl = item.querySelector('.text-success') || item.querySelector('.precio-base');
            let precio = 0;
            
            if (precioEl) {
                const precioText = precioEl.textContent.replace(/[^\d]/g, '');
                precio = parseFloat(precioText);
            }
            
            // Verificar si cumple con todos los filtros
            const cumpleBusqueda = nombre.includes(busqueda) || descripcion.includes(busqueda);
            const cumpleTipo = !tipoSeleccionado || tipo === tipoSeleccionado;
            const cumplePrecioMin = isNaN(precioMin) || precio >= precioMin;
            const cumplePrecioMax = isNaN(precioMax) || precio <= precioMax;
            
            const mostrarItem = cumpleBusqueda && cumpleTipo && cumplePrecioMin && cumplePrecioMax;
            
            if (mostrarItem) {
                item.style.display = '';
                serviciosVisibles++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Mostrar mensaje cuando no hay resultados
        const contenedorServicios = document.querySelector(contenedorSelector);
        let mensajeNoResultados = document.getElementById('mensajeNoResultados');
        
        if (serviciosVisibles === 0) {
            if (!mensajeNoResultados) {
                mensajeNoResultados = document.createElement('div');
                mensajeNoResultados.id = 'mensajeNoResultados';
                mensajeNoResultados.className = 'col-12 text-center mt-4';
                mensajeNoResultados.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        No se encontraron servicios con los filtros seleccionados.
                    </div>
                `;
                contenedorServicios.appendChild(mensajeNoResultados);
            }
        } else if (mensajeNoResultados) {
            mensajeNoResultados.remove();
        }
    }
    
    // Eventos para cada filtro
    if (buscarServicioInput) {
        buscarServicioInput.addEventListener('input', aplicarFiltros);
    }
    
    if (filtroTipo) {
        filtroTipo.addEventListener('change', aplicarFiltros);
    }
    
    if (filtroPrecioMin) {
        filtroPrecioMin.addEventListener('input', aplicarFiltros);
    }
    
    if (filtroPrecioMax) {
        filtroPrecioMax.addEventListener('input', aplicarFiltros);
    }
    
    // Botón para limpiar filtros
    if (limpiarFiltros) {
        limpiarFiltros.addEventListener('click', function() {
            if (buscarServicioInput) buscarServicioInput.value = '';
            if (filtroTipo) filtroTipo.value = '';
            if (filtroPrecioMin) filtroPrecioMin.value = '';
            if (filtroPrecioMax) filtroPrecioMax.value = '';
            aplicarFiltros();
        });
    }
}

// Función para inicializar el filtro en cualquier sección
function inicializarFiltro(contenedorSelector, itemSelector) {
    const contenedor = document.querySelector(contenedorSelector);
    if (!contenedor) {
        console.error(`No se encontró el contenedor ${contenedorSelector}`);
        return;
    }
    
    // Insertar el componente de filtro al principio del contenedor
    contenedor.insertAdjacentHTML('afterbegin', crearComponenteFiltro());
    
    // Configurar los eventos de filtrado
    configurarFiltros(contenedorSelector, itemSelector);
}

// Exportar las funciones al objeto global
window.filtrosManager = {
    crearComponenteFiltro,
    configurarFiltros,
    inicializarFiltro
}; 