// Variables globales
let productos = [];
let categorias = [];
let carrito = [];
let categoriaActual = '';
let busquedaActual = '';

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando tienda...');
    
    try {
        await cargarCategorias();
        await cargarProductos();
        inicializarEventos();
        cargarCarrito();
        console.log('Tienda inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la tienda:', error);
        mostrarError('Error al cargar la tienda');
    }
});

// Inicializar eventos
function inicializarEventos() {
    // Evento de búsqueda
    const inputBusqueda = document.getElementById('busqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            busquedaActual = e.target.value.toLowerCase();
            filtrarProductos();
        });
    }

    // Evento de compra
    const btnComprar = document.getElementById('btnComprar');
    if (btnComprar) {
        btnComprar.addEventListener('click', realizarCompra);
    }
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const response = await fetch('/api/tienda/categorias');
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        categorias = await response.json();
        actualizarCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        throw error;
    }
}

// Actualizar categorías en el DOM
function actualizarCategorias() {
    const contenedor = document.getElementById('categorias');
    if (!contenedor) return;

    const botones = [
        `<button class="btn btn-categoria ${categoriaActual === '' ? 'activa' : ''}"
                 onclick="filtrarPorCategoria('')">
            Todas
        </button>`
    ];

    botones.push(...categorias.map(categoria => `
        <button class="btn btn-categoria ${categoriaActual === categoria.id ? 'activa' : ''}"
                onclick="filtrarPorCategoria(${categoria.id})">
            ${categoria.nombre}
        </button>
    `));

    contenedor.innerHTML = botones.join('');
}

// Cargar productos
async function cargarProductos() {
    try {
        const response = await fetch('/api/tienda/productos');
        if (!response.ok) throw new Error('Error al cargar productos');
        
        productos = await response.json();
        filtrarProductos();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        throw error;
    }
}

// Función auxiliar para obtener el nombre del archivo de una ruta
function getFileName(filePath) {
    if (!filePath) return '';
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
}

// Filtrar y mostrar productos
function filtrarProductos() {
    const productosFiltrados = productos.filter(producto => {
        const coincideCategoria = !categoriaActual || producto.categoriaId === categoriaActual;
        const coincideBusqueda = !busquedaActual || 
            producto.nombre.toLowerCase().includes(busquedaActual) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(busquedaActual));
        return coincideCategoria && coincideBusqueda;
    });

    const contenedor = document.getElementById('productos');
    if (!contenedor) return;

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <p class="mt-3 text-muted">No se encontraron productos</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = productosFiltrados.map(producto => {
        const imagenUrl = producto.imagen ? 
            (producto.imagen.startsWith('http') ? producto.imagen : 
             producto.imagen.includes(':\\') ? `/uploads/productos/${getFileName(producto.imagen)}` : 
             `/uploads/productos/${producto.imagen}`) : 
            '/img/no-image.png';

        const stock = producto.stock ? producto.stock.cantidad : 0;
        const precio = Number(producto.precio).toFixed(2);
        const categoria = categorias.find(c => c.id === producto.categoriaId);

        return `
        <div class="col fade-in">
            <div class="producto-card">
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}"
                     class="producto-imagen"
                     onclick="mostrarDetallesProducto(${producto.id})"
                     style="cursor: pointer"
                     onerror="this.onerror=null; this.src='/img/no-image.png'">
                <div class="p-3">
                    <h5 class="card-title mb-1">${producto.nombre}</h5>
                    <p class="text-muted small mb-2">${categoria ? categoria.nombre : ''}</p>
                    <p class="producto-precio mb-1">$${precio}</p>
                    <p class="producto-stock mb-2">
                        <i class="bi bi-box-seam me-1"></i>
                        ${stock} disponibles
                    </p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary" 
                                onclick="mostrarDetallesProducto(${producto.id})">
                            <i class="bi bi-info-circle me-2"></i>
                            Ver detalles
                        </button>
                        <button class="btn btn-primary" 
                                onclick="agregarAlCarrito(${producto.id})"
                                ${stock === 0 ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus me-2"></i>
                            ${stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Filtrar por categoría
function filtrarPorCategoria(categoriaId) {
    categoriaActual = categoriaId;
    actualizarCategorias();
    filtrarProductos();
}

// Funciones del carrito
function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
        actualizarCarrito();
    }
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
}

function actualizarCarrito() {
    const contenedor = document.getElementById('carritoItems');
    const contador = document.querySelector('.carrito-contador');
    const totalElement = document.getElementById('carritoTotal');
    
    if (!contenedor || !contador || !totalElement) return;

    // Actualizar contador
    const cantidadTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contador.textContent = cantidadTotal;

    // Si el carrito está vacío
    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-cart-x display-4 text-muted"></i>
                <p class="mt-3 text-muted">Tu carrito está vacío</p>
            </div>
        `;
        totalElement.textContent = '$0.00';
        return;
    }

    // Mostrar items del carrito
    contenedor.innerHTML = carrito.map(item => {
        const producto = productos.find(p => p.id === item.productoId);
        if (!producto) return '';

        const imagenUrl = producto.imagen ? 
            (producto.imagen.startsWith('http') ? producto.imagen : 
             producto.imagen.includes(':\\') ? `/uploads/productos/${getFileName(producto.imagen)}` : 
             `/uploads/productos/${producto.imagen}`) : 
            '/img/no-image.png';

        const subtotal = (producto.precio * item.cantidad).toFixed(2);

        return `
        <div class="carrito-item">
            <div class="d-flex">
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}"
                     class="carrito-item-imagen me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${producto.nombre}</h6>
                    <p class="mb-1 text-muted">$${producto.precio} x ${item.cantidad}</p>
                    <p class="mb-0 text-primary">$${subtotal}</p>
                </div>
                <div class="d-flex flex-column">
                    <button class="btn btn-sm btn-outline-primary mb-1"
                            onclick="cambiarCantidad(${producto.id}, ${item.cantidad + 1})">
                        <i class="bi bi-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger"
                            onclick="cambiarCantidad(${producto.id}, ${item.cantidad - 1})">
                        <i class="bi bi-dash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Actualizar total
    const total = carrito.reduce((sum, item) => {
        const producto = productos.find(p => p.id === item.productoId);
        return sum + (producto ? producto.precio * item.cantidad : 0);
    }, 0);
    totalElement.textContent = `$${total.toFixed(2)}`;
}

function agregarAlCarrito(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto || !producto.stock) return;

    const itemExistente = carrito.find(item => item.productoId === productoId);
    
    if (itemExistente) {
        if (itemExistente.cantidad >= producto.stock.cantidad) {
            mostrarError('No hay suficiente stock disponible');
            return;
        }
        itemExistente.cantidad++;
    } else {
        carrito.push({
            productoId,
            cantidad: 1
        });
    }

    guardarCarrito();
    mostrarExito('Producto agregado al carrito');
}

function cambiarCantidad(productoId, nuevaCantidad) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto || !producto.stock) return;

    if (nuevaCantidad <= 0) {
        carrito = carrito.filter(item => item.productoId !== productoId);
    } else if (nuevaCantidad <= producto.stock.cantidad) {
        const item = carrito.find(item => item.productoId === productoId);
        if (item) {
            item.cantidad = nuevaCantidad;
        }
    } else {
        mostrarError('No hay suficiente stock disponible');
        return;
    }

    guardarCarrito();
}

async function realizarCompra() {
    if (carrito.length === 0) {
        mostrarError('El carrito está vacío');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Obtener el ID del usuario del token decodificado
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenData.id;

        // Obtener el cliente asociado al usuario
        const usuarioResponse = await fetch(`/api/usuarios/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!usuarioResponse.ok) {
            throw new Error('No se pudo obtener la información del usuario');
        }

        const usuario = await usuarioResponse.json();
        
        if (!usuario.cliente) {
            throw new Error('El usuario no tiene un cliente asociado');
        }

        const clienteId = usuario.cliente.id;

        // Calcular el total de la compra
        const total = carrito.reduce((sum, item) => {
            const producto = productos.find(p => p.id === item.productoId);
            return sum + (producto ? producto.precio * item.cantidad : 0);
        }, 0);

        // Preparar los detalles de la venta
        const detallesVenta = carrito.map(item => {
            const producto = productos.find(p => p.id === item.productoId);
            return {
                productoId: Number(item.productoId),
                cantidad: Number(item.cantidad),
                precioUnitario: Number(producto.precio),
                productoNombre: producto.nombre
            };
        });

        // Crear la venta
        const response = await fetch('/api/tienda/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                clienteId: Number(clienteId),
                total: Number(total),
                detalles: detallesVenta.map(detalle => ({
                    productoId: Number(detalle.productoId),
                    cantidad: Number(detalle.cantidad),
                    precioUnitario: Number(detalle.precioUnitario),
                    productoNombre: detalle.productoNombre
                }))
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al procesar la compra');
        }

        const data = await response.json();
        
        // Limpiar carrito
        carrito = [];
        guardarCarrito();

        // Recargar productos para actualizar stock
        await cargarProductos();

        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Compra realizada!',
            text: 'Tu pedido ha sido procesado correctamente',
            confirmButtonText: 'Aceptar'
        });

        // Cerrar el offcanvas del carrito
        const offcanvas = document.getElementById('carritoOffcanvas');
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }

    } catch (error) {
        console.error('Error al realizar la compra:', error);
        mostrarError(error.message);
    }
}

// Funciones de utilidad
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

// Función para mostrar detalles del producto
function mostrarDetallesProducto(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const categoria = categorias.find(c => c.id === producto.categoriaId);
    const stock = producto.stock ? producto.stock.cantidad : 0;
    const precio = Number(producto.precio).toFixed(2);
    
    const imagenUrl = producto.imagen ? 
        (producto.imagen.startsWith('http') ? producto.imagen : 
         producto.imagen.includes(':\\') ? `/uploads/productos/${getFileName(producto.imagen)}` : 
         `/uploads/productos/${producto.imagen}`) : 
        '/img/no-image.png';

    Swal.fire({
        title: producto.nombre,
        html: `
            <div class="text-start">
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}"
                     class="img-fluid mb-3 rounded"
                     style="max-height: 300px; width: 100%; object-fit: cover;"
                     onerror="this.onerror=null; this.src='/img/no-image.png'">
                
                <div class="mb-3">
                    <h6 class="text-muted mb-2">Categoría</h6>
                    <p>${categoria ? categoria.nombre : 'Sin categoría'}</p>
                </div>

                <div class="mb-3">
                    <h6 class="text-muted mb-2">Descripción</h6>
                    <p>${producto.descripcion || 'Sin descripción'}</p>
                </div>

                <div class="mb-3">
                    <h6 class="text-muted mb-2">Precio</h6>
                    <p class="text-primary h4">$${precio}</p>
                </div>

                <div class="mb-3">
                    <h6 class="text-muted mb-2">Stock disponible</h6>
                    <p class="text-success">
                        <i class="bi bi-box-seam me-2"></i>
                        ${stock} unidades
                    </p>
                </div>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: stock === 0 ? 'Sin stock' : 'Agregar al carrito',
        confirmButtonColor: '#1a472a',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        cancelButtonColor: '#1a472a',
        buttonsStyling: true,
        width: '32rem',
        customClass: {
            container: 'producto-modal',
            closeButton: 'btn-close-white',
            cancelButton: 'text-white'
        }
    }).then((result) => {
        if (result.isConfirmed && stock > 0) {
            agregarAlCarrito(productoId);
        }
    });
}

// Función para salir de la tienda
function salir() {
    // Limpiar el carrito
    carrito = [];
    localStorage.removeItem('carrito');
    
    // Redirigir al inicio
    window.location.href = '/';
}