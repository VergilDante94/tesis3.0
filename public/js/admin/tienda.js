let productos = [];
let productosFiltrados = [];
let categorias = [];
let editandoProducto = null;
let editandoCategoria = null;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Admin Tienda] Verificando autenticación...');
    
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario || usuario.tipo !== 'ADMIN') {
            console.log('[Admin Tienda] Usuario no autorizado');
            window.location.href = '/';
            return;
        }

        console.log('[Admin Tienda] Cargando datos iniciales...');
        await cargarCategorias();
        await cargarProductos();
        inicializarEventos();
        console.log('[Admin Tienda] Inicialización completada');
    } catch (error) {
        console.error('[Admin Tienda] Error en la inicialización:', error);
        mostrarError('Error al cargar el panel de administración');
    }
});

// Inicializar eventos
function inicializarEventos() {
    // Formulario de categorías
    const formCategoria = document.getElementById('formCategoria');
    if (formCategoria) {
        formCategoria.addEventListener('submit', manejarEnvioCategoria);
    }

    // Botón cancelar categoría
    const btnCancelarCategoria = document.getElementById('btnCancelarCategoria');
    if (btnCancelarCategoria) {
        btnCancelarCategoria.addEventListener('click', limpiarFormularioCategoria);
    }

    // Formulario de productos
    const formProducto = document.getElementById('formProducto');
    if (formProducto) {
        formProducto.addEventListener('submit', manejarEnvioProducto);
    }

    // Previsualización de imagen
    const inputImagen = document.getElementById('imagen');
    if (inputImagen) {
        inputImagen.addEventListener('change', previsualizarImagen);
    }
}

// Funciones para Categorías
async function cargarCategorias() {
    try {
        const response = await fetch('/api/tienda/categorias');
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        categorias = await response.json();
        actualizarTablaCategorias();
        actualizarSelectCategorias();
    } catch (error) {
        console.error('[Admin Tienda] Error al cargar categorías:', error);
        throw error;
    }
}

function actualizarTablaCategorias() {
    const tbody = document.getElementById('tablaCategorias');
    if (!tbody) return;

    tbody.innerHTML = categorias.map(categoria => `
        <tr>
            <td>${categoria.id}</td>
            <td>${categoria.nombre}</td>
            <td>${categoria.descripcion || ''}</td>
            <td>
                <button onclick="editarCategoria(${categoria.id})" class="btn btn-warning btn-sm">
                    <i class="bi bi-pencil"></i>
                </button>
                <button onclick="eliminarCategoria(${categoria.id})" class="btn btn-danger btn-sm ms-1">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function actualizarSelectCategorias() {
    const selectProducto = document.getElementById('categoria');
    const selectFiltro = document.getElementById('filtroCategoria');
    
    const options = `
        <option value="">Seleccione una categoría</option>
        ${categorias.map(categoria => `
            <option value="${categoria.id}">${categoria.nombre}</option>
        `).join('')}
    `;

    if (selectProducto) selectProducto.innerHTML = options;
    if (selectFiltro) selectFiltro.innerHTML = '<option value="">Todas las categorías</option>' + options;
}

async function manejarEnvioCategoria(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const categoria = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion')
        };
        
        const url = editandoCategoria ? 
            `/api/tienda/categorias/${editandoCategoria}` : 
            '/api/tienda/categorias';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(url, {
            method: editandoCategoria ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoria)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al guardar categoría');
        }
        
        await cargarCategorias();
        limpiarFormularioCategoria();
        mostrarExito('Categoría guardada exitosamente');
    } catch (error) {
        console.error('[Admin Tienda] Error al guardar categoría:', error);
        mostrarError(error.message);
    }
}

function editarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;

    editandoCategoria = id;
    
    const form = document.getElementById('formCategoria');
    if (!form) return;

    form.nombre.value = categoria.nombre;
    form.descripcion.value = categoria.descripcion || '';
    
    const btnSubmit = document.getElementById('btnSubmitCategoria');
    const btnCancelar = document.getElementById('btnCancelarCategoria');
    const titulo = document.getElementById('formCategoriaTitulo');
    
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="bi bi-save me-2"></i>Actualizar Categoría';
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'block';
    }
    if (titulo) {
        titulo.textContent = 'Editar Categoría';
    }

    // Hacer scroll al formulario
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarCategoria(id) {
    try {
        const confirmacion = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#1a472a',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            buttonsStyling: true
        });

        if (!confirmacion.isConfirmed) return;

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`/api/tienda/categorias/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al eliminar categoría');
        }
        
        await cargarCategorias();
        mostrarExito('Categoría eliminada exitosamente');
    } catch (error) {
        console.error('[Admin Tienda] Error al eliminar categoría:', error);
        mostrarError(error.message);
    }
}

function limpiarFormularioCategoria() {
    const form = document.getElementById('formCategoria');
    if (!form) return;

    form.reset();
    editandoCategoria = null;
    
    const btnSubmit = document.getElementById('btnSubmitCategoria');
    const btnCancelar = document.getElementById('btnCancelarCategoria');
    const titulo = document.getElementById('formCategoriaTitulo');
    
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Crear Categoría';
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    if (titulo) {
        titulo.textContent = 'Nueva Categoría';
    }
}

// Funciones para Productos
async function cargarProductos() {
    try {
        const response = await fetch('/api/tienda/productos');
        if (!response.ok) throw new Error('Error al cargar productos');
        
        productos = await response.json();
        actualizarTablaProductos();
    } catch (error) {
        console.error('[Admin Tienda] Error al cargar productos:', error);
        throw error;
    }
}

function actualizarTablaProductos() {
    const tbody = document.getElementById('tablaProductos');
    if (!tbody) return;

    const productosAMostrar = productosFiltrados.length > 0 ? productosFiltrados : productos;

    tbody.innerHTML = productosAMostrar.map(producto => {
        // Función auxiliar para obtener el nombre del archivo de una ruta
        const getFileName = (filePath) => {
            if (!filePath) return '';
            // Si la ruta contiene barras invertidas o normales, tomar la última parte
            const parts = filePath.split(/[\\/]/);
            return parts[parts.length - 1];
        };

        // Determinar la URL de la imagen
        const imagenUrl = producto.imagen ? 
            (producto.imagen.startsWith('http') ? producto.imagen : 
             producto.imagen.includes(':\\') ? `/uploads/productos/${getFileName(producto.imagen)}` : 
             `/uploads/productos/${producto.imagen}`) : 
            '/img/no-image.png';

        const categoria = categorias.find(c => c.id === producto.categoriaId);
        const precio = Number(producto.precio).toFixed(2);
        const stock = producto.stock ? Number(producto.stock.cantidad) : 0;

        return `
        <tr>
            <td>${producto.id}</td>
            <td>
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}" 
                     class="producto-imagen"
                     onclick="abrirModal('${imagenUrl}')"
                     onerror="this.onerror=null; this.src='/img/no-image.png'; this.classList.add('error');">
            </td>
            <td>${producto.nombre}</td>
            <td>
                <div class="descripcion-producto" onclick="toggleDescripcion(this)">
                    ${producto.descripcion}
                </div>
            </td>
            <td>$${precio}</td>
            <td>${stock}</td>
            <td>${categoria ? categoria.nombre : 'N/A'}</td>
            <td>
                <div class="btn-group">
                    <button onclick="editarProducto(${producto.id})" class="btn btn-warning btn-sm">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button onclick="eliminarProducto(${producto.id})" class="btn btn-danger btn-sm ms-1">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    // Mostrar mensaje si no hay resultados
    if (productosAMostrar.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="bi bi-search me-2"></i>
                No se encontraron productos que coincidan con los filtros
            </td>
        </tr>
        `;
    }
}

// Función para expandir/contraer la descripción
function toggleDescripcion(elemento) {
    elemento.classList.toggle('expandida');
}

async function manejarEnvioProducto(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        // Convertir precio y stock a números
        const precio = parseFloat(formData.get('precio'));
        const cantidad = parseInt(formData.get('stock'));
        const categoriaId = parseInt(formData.get('categoriaId'));
        
        // Validar que los valores sean números válidos
        if (isNaN(precio) || precio < 0) {
            throw new Error('El precio debe ser un número válido mayor o igual a 0');
        }
        if (isNaN(cantidad) || cantidad < 0) {
            throw new Error('El stock debe ser un número válido mayor o igual a 0');
        }
        if (isNaN(categoriaId)) {
            throw new Error('Debe seleccionar una categoría válida');
        }

        // Si estamos editando y no se seleccionó una nueva imagen, no incluir el campo imagen
        if (editandoProducto && !formData.get('imagen').size) {
            formData.delete('imagen');
        }

        const url = editandoProducto ? 
            `/api/tienda/productos/${editandoProducto}` : 
            '/api/tienda/productos';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        // Crear un nuevo FormData con los valores convertidos
        const nuevoFormData = new FormData();
        nuevoFormData.append('nombre', formData.get('nombre'));
        nuevoFormData.append('descripcion', formData.get('descripcion'));
        nuevoFormData.append('precio', precio);
        nuevoFormData.append('cantidad', cantidad);
        nuevoFormData.append('categoriaId', categoriaId);
        
        // Solo añadir la imagen si existe
        const imagen = formData.get('imagen');
        if (imagen && imagen.size > 0) {
            nuevoFormData.append('imagen', imagen);
        }

        console.log('[Admin Tienda] Enviando producto:', {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            precio,
            cantidad,
            categoriaId,
            tieneImagen: imagen && imagen.size > 0
        });

        const response = await fetch(url, {
            method: editandoProducto ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: nuevoFormData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al guardar producto');
        }
        
        await cargarProductos();
        limpiarFormularioProducto();
        mostrarExito('Producto guardado exitosamente');
    } catch (error) {
        console.error('[Admin Tienda] Error al guardar producto:', error);
        mostrarError(error.message);
    }
}

function editarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    editandoProducto = id;
    
    const form = document.getElementById('formProducto');
    if (!form) return;

    // Función auxiliar para obtener el nombre del archivo de una ruta
    const getFileName = (filePath) => {
        if (!filePath) return '';
        // Si la ruta contiene barras invertidas o normales, tomar la última parte
        const parts = filePath.split(/[\\/]/);
        return parts[parts.length - 1];
    };

    // Asegurarnos de que los valores sean del tipo correcto
    form.nombre.value = producto.nombre || '';
    form.descripcion.value = producto.descripcion || '';
    form.precio.value = typeof producto.precio === 'number' ? producto.precio : '';
    form.stock.value = producto.stock ? producto.stock.cantidad : '';
    form.categoria.value = producto.categoriaId ? producto.categoriaId.toString() : '';
    
    const preview = document.getElementById('imagenPreview');
    if (preview) {
        const imagenUrl = producto.imagen ? 
            (producto.imagen.startsWith('http') ? producto.imagen : 
             producto.imagen.includes(':\\') ? `/uploads/productos/${getFileName(producto.imagen)}` : 
             `/uploads/productos/${producto.imagen}`) : 
            '/img/no-image.png';
        
        preview.src = imagenUrl;
        preview.style.display = 'block';
    }
    
    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="bi bi-save me-2"></i>Actualizar Producto';
    }

    // Hacer scroll al formulario
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarProducto(id) {
    try {
        const confirmacion = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#1a472a',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            buttonsStyling: true
        });

        if (!confirmacion.isConfirmed) return;

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`/api/tienda/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al eliminar producto');
        }
        
        await cargarProductos();
        mostrarExito('Producto eliminado exitosamente');
    } catch (error) {
        console.error('[Admin Tienda] Error al eliminar producto:', error);
        mostrarError(error.message);
    }
}

function limpiarFormularioProducto() {
    const form = document.getElementById('formProducto');
    if (!form) return;

    form.reset();
    editandoProducto = null;
    
    const preview = document.getElementById('imagenPreview');
    if (preview) {
        preview.src = '/img/no-image.png';
        preview.style.display = 'none';
    }
    
    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Crear Producto';
    }
}

function previsualizarImagen(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagenPreview');
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            preview.classList.remove('error');
        };
        reader.onerror = function() {
            preview.src = '/img/no-image.png';
            preview.classList.add('error');
        };
        reader.readAsDataURL(file);
    }
}

// Funciones para el modal de imagen
function abrirModal(imagenUrl) {
    const modal = document.getElementById('modalImagen');
    const imagenAmpliada = document.getElementById('imagenAmpliada');
    
    if (modal && imagenAmpliada) {
        imagenAmpliada.src = imagenUrl;
        modal.classList.add('activo');
        
        // Prevenir que el scroll del body cuando el modal está abierto
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalImagen');
    if (modal) {
        modal.classList.remove('activo');
        // Restaurar el scroll del body
        document.body.style.overflow = '';
    }
}

// Funciones de utilidad
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        timer: 1500,
        showConfirmButton: false
    });
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje
    });
}

// Función para aplicar los filtros
function aplicarFiltros() {
    const textoBusqueda = document.getElementById('filtroTexto')?.value.toLowerCase() || '';
    const categoriaId = document.getElementById('filtroCategoria')?.value || '';
    const precioMin = document.getElementById('filtroPrecioMin')?.value || '';
    const precioMax = document.getElementById('filtroPrecioMax')?.value || '';

    productosFiltrados = productos.filter(producto => {
        // Filtro por texto (nombre y descripción)
        const coincideTexto = textoBusqueda === '' || 
            producto.nombre.toLowerCase().includes(textoBusqueda) || 
            (producto.descripcion && producto.descripcion.toLowerCase().includes(textoBusqueda));

        // Filtro por categoría
        const coincideCategoria = categoriaId === '' || 
            producto.categoriaId === parseInt(categoriaId);

        // Filtro por precio mínimo
        const coincidePrecioMin = precioMin === '' || 
            producto.precio >= parseFloat(precioMin);

        // Filtro por precio máximo
        const coincidePrecioMax = precioMax === '' || 
            producto.precio <= parseFloat(precioMax);

        return coincideTexto && coincideCategoria && coincidePrecioMin && coincidePrecioMax;
    });

    actualizarTablaProductos();
}