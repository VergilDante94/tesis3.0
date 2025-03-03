function loadServicesForOrders() {
    const serviciosDisponibles = document.getElementById('serviciosDisponibles');
    
    // Crear formulario inicial para cantidad de servicios
    const cantidadForm = document.createElement('div');
    cantidadForm.className = 'card mb-4';
    cantidadForm.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">¿Cuántos servicios diferentes desea solicitar?</h5>
            <div class="mb-3">
                <input type="number" 
                    class="form-control" 
                    id="cantidadServicios" 
                    min="1" 
                    max="10" 
                    value="1" 
                    style="max-width: 200px;">
                <div class="form-text">Ingrese un número entre 1 y 10</div>
            </div>
            <button class="btn btn-primary" onclick="cargarFormularioServicios()">
                Continuar
            </button>
        </div>
    `;
    
    serviciosDisponibles.innerHTML = '';
    serviciosDisponibles.appendChild(cantidadForm);
}

function cargarFormularioServicios() {
    const cantidadServicios = parseInt(document.getElementById('cantidadServicios').value) || 0;
    
    if (cantidadServicios < 1 || cantidadServicios > 10) {
        alert('Por favor, ingrese una cantidad válida entre 1 y 10 servicios.');
        return;
    }
    
    const serviciosDisponibles = document.getElementById('serviciosDisponibles');
    serviciosDisponibles.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>';

    fetch('http://localhost:3000/api/servicios')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la red: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            serviciosDisponibles.innerHTML = '';

            if (data.length === 0) {
                serviciosDisponibles.innerHTML = '<div class="alert alert-info">No hay servicios disponibles.</div>';
                return;
            }

            // Crear contenedor para los servicios
            const serviciosContainer = document.createElement('div');
            serviciosContainer.className = 'row g-3';

            // Agregar mensaje informativo
            const mensajeInfo = document.createElement('div');
            mensajeInfo.className = 'col-12';
            mensajeInfo.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    Por favor, seleccione ${cantidadServicios} servicio(s)
                </div>
            `;
            serviciosContainer.appendChild(mensajeInfo);

            data.forEach(servicio => {
                const servicioItem = document.createElement('div');
                servicioItem.className = 'col-md-6';

                const precioBase = parseFloat(servicio.precioBase) || 0;

                servicioItem.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <div class="form-check">
                                <input class="form-check-input servicio-checkbox" type="checkbox" 
                                    value="${servicio.idServicio}" 
                                    id="servicio${servicio.idServicio}" 
                                    data-nombre="${servicio.nombre}"
                                    data-precio="${precioBase}"
                                    onchange="validarCantidadServicios(); updateTotal()">
                                <label class="form-check-label" for="servicio${servicio.idServicio}">
                                    <strong>${servicio.nombre}</strong>
                                    <br>
                                    <small class="text-muted">Precio base: $${precioBase.toFixed(2)}</small>
                                </label>
                            </div>
                            <div class="mt-2">
                                <label class="form-label" for="cantidad${servicio.idServicio}">Cantidad:</label>
                                <input type="number" 
                                    class="form-control" 
                                    id="cantidad${servicio.idServicio}" 
                                    value="1" 
                                    min="1" 
                                    style="width: 100px;"
                                    onchange="updateTotal()">
                            </div>
                        </div>
                    </div>
                `;

                serviciosContainer.appendChild(servicioItem);
            });

            serviciosDisponibles.appendChild(serviciosContainer);

            // Agregar sección para mostrar el total
            const totalSection = document.createElement('div');
            totalSection.className = 'mt-3 p-3 bg-light rounded';
            totalSection.id = 'totalSection';
            totalSection.innerHTML = '<h4>Total: $0.00</h4>';
            serviciosDisponibles.appendChild(totalSection);

            // Agregar el botón de submit
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.id = 'submitButton';
            submitButton.className = 'btn btn-primary mt-3';
            submitButton.textContent = 'Solicitar Servicios';
            submitButton.disabled = true;
            serviciosDisponibles.appendChild(submitButton);

            // Agregar botón para volver
            const volverButton = document.createElement('button');
            volverButton.type = 'button';
            volverButton.className = 'btn btn-secondary mt-3 ms-2';
            volverButton.textContent = 'Volver';
            volverButton.onclick = loadServicesForOrders;
            serviciosDisponibles.appendChild(volverButton);
        })
        .catch(error => {
            console.error('Error al cargar servicios:', error);
            serviciosDisponibles.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error al cargar los servicios</h4>
                    <p>${error.message}</p>
                    <hr>
                    <button class="btn btn-outline-danger" onclick="cargarFormularioServicios()">
                        <i class="bi bi-arrow-clockwise"></i> Intentar de nuevo
                    </button>
                </div>
            `;
        });
}

function validarCantidadServicios() {
    const cantidadInput = document.getElementById('cantidadServicios');
    if (!cantidadInput) {
        console.error('No se encontró el elemento cantidadServicios');
        return;
    }

    const cantidad = parseInt(cantidadInput.value) || 0;
    const serviciosSeleccionados = document.querySelectorAll('input[type="checkbox"]:checked').length;
    const submitButton = document.getElementById('submitButton');
    
    if (!submitButton) {
        console.error('No se encontró el botón de submit');
        return;
    }

    if (serviciosSeleccionados === cantidad) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

function updateTotal() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    let totalCost = 0;

    checkboxes.forEach(checkbox => {
        const servicePrice = parseFloat(checkbox.getAttribute('data-precio'));
        const quantityInput = document.getElementById(`cantidad${checkbox.id.replace('servicio', '')}`);
        const quantity = parseInt(quantityInput.value) || 1;
        totalCost += servicePrice * quantity;
    });

    const totalSection = document.getElementById('totalSection');
    if (totalSection) {
        totalSection.innerHTML = `<h4>Total: $${totalCost.toFixed(2)}</h4>`;
    }
}

document.getElementById('ordenesForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const selectedServices = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    let totalCost = 0;

    if (checkboxes.length === 0) {
        alert('Por favor, seleccione al menos un servicio.');
        return;
    }

    checkboxes.forEach(checkbox => {
        const serviceName = checkbox.getAttribute('data-nombre');
        const servicePrice = parseFloat(checkbox.getAttribute('data-precio'));
        const serviceId = checkbox.value;
        const quantityInput = document.getElementById(`cantidad${checkbox.id.replace('servicio', '')}`);
        const quantity = parseInt(quantityInput.value) || 1;

        if (quantity < 1) {
            alert(`La cantidad para ${serviceName} debe ser al menos 1.`);
            return;
        }

        selectedServices.push({ 
            id: serviceId,
            name: serviceName, 
            price: servicePrice, 
            quantity: quantity 
        });
        totalCost += servicePrice * quantity;
    });

    // Mostrar la factura en la sección de facturas
    showInvoice(selectedServices, totalCost);

    // Limpiar selecciones después de crear la factura
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateTotal();
});