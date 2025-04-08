const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
    console.log('=== Inicio GET /api/tienda/productos ===');
    console.log('Query params:', req.query);
    
    try {
        // Construir las condiciones de búsqueda
        const where = {
            activo: true
        };

        // Aplicar filtros si existen
        if (req.query.nombre) {
            console.log('Filtrando por nombre:', req.query.nombre);
            where.nombre = {
                contains: req.query.nombre
            };
        }

        if (req.query.categoriaId) {
            console.log('Filtrando por categoría:', req.query.categoriaId);
            where.categoriaId = parseInt(req.query.categoriaId);
        }

        if (req.query.precioMinimo) {
            console.log('Filtrando por precio mínimo:', req.query.precioMinimo);
            where.precio = {
                ...where.precio,
                gte: parseFloat(req.query.precioMinimo)
            };
        }

        if (req.query.precioMaximo) {
            console.log('Filtrando por precio máximo:', req.query.precioMaximo);
            where.precio = {
                ...where.precio,
                lte: parseFloat(req.query.precioMaximo)
            };
        }

        console.log('Condiciones de búsqueda:', where);

        const productos = await prisma.producto.findMany({
            include: {
                categoria: true,
                stock: true
            },
            where
        });

        console.log(`Se encontraron ${productos.length} productos`);
        
        // Añadir registro de los precios de los productos encontrados
        if (productos.length > 0) {
            console.log('Precios de productos encontrados:');
            productos.forEach(p => {
                console.log(`- ${p.id}: ${p.nombre} - $${p.precio}`);
            });
        }
        
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

// Obtener un producto por ID
const obtenerProductoPorId = async (req, res) => {
    console.log('=== Inicio GET /api/tienda/productos/:id ===');
    const { id } = req.params;
    console.log('ID solicitado:', id);

    try {
        if (!id || isNaN(parseInt(id))) {
            console.error('ID de producto inválido:', id);
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        console.log('Buscando producto en la base de datos...');
        const producto = await prisma.producto.findUnique({
            where: { id: parseInt(id) },
            include: {
                categoria: true,
                stock: true
            }
        });

        if (!producto) {
            console.log('Producto no encontrado con ID:', id);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log('Producto encontrado:', {
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoria?.nombre,
            stock: producto.stock?.cantidad
        });

        res.json(producto);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
};

// Crear un nuevo producto
const crearProducto = async (req, res) => {
    console.log('=== Inicio POST /api/tienda/productos ===');
    console.log('Datos recibidos:', {
        ...req.body,
        imagen: req.file ? req.file.filename : 'No se recibió imagen'
    });

    try {
        // Validar datos requeridos
        const { nombre, descripcion, precio, categoriaId } = req.body;
        
        if (!nombre || !descripcion || !precio || !categoriaId) {
            console.error('Datos incompletos:', { nombre, descripcion, precio, categoriaId });
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        console.log('Validando categoría...');
        const categoriaExiste = await prisma.categoria.findUnique({
            where: { id: parseInt(categoriaId) }
        });

        if (!categoriaExiste) {
            console.error('Categoría no encontrada:', categoriaId);
            return res.status(400).json({ error: 'La categoría especificada no existe' });
        }

        console.log('Creando nuevo producto...');
        const producto = await prisma.producto.create({
            data: {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                imagen: req.file ? req.file.filename : null,
                categoriaId: parseInt(categoriaId),
                activo: true
            }
        });

        console.log('Producto creado exitosamente:', {
            id: producto.id,
            nombre: producto.nombre,
            categoria: categoriaId
        });

        // Crear registro de stock inicial
        console.log('Creando registro de stock inicial...');
        await prisma.stock.create({
            data: {
                productoId: producto.id,
                cantidad: 0
            }
        });

        res.json(producto);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
};

// Actualizar un producto
const actualizarProducto = async (req, res) => {
    console.log('=== Inicio PUT /api/tienda/productos/:id ===');
    const { id } = req.params;
    console.log('ID del producto a actualizar:', id);
    console.log('Datos de actualización:', {
        ...req.body,
        imagen: req.file ? req.file.filename : 'No se modificó la imagen'
    });

    try {
        if (!id || isNaN(parseInt(id))) {
            console.error('ID de producto inválido:', id);
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        // Verificar si el producto existe
        console.log('Verificando existencia del producto...');
        const productoExistente = await prisma.producto.findUnique({
            where: { id: parseInt(id) }
        });

        if (!productoExistente) {
            console.log('Producto no encontrado con ID:', id);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Validar categoría si se va a actualizar
        if (req.body.categoriaId) {
            console.log('Validando nueva categoría:', req.body.categoriaId);
            const categoriaExiste = await prisma.categoria.findUnique({
                where: { id: parseInt(req.body.categoriaId) }
            });

            if (!categoriaExiste) {
                console.error('Categoría no encontrada:', req.body.categoriaId);
                return res.status(400).json({ error: 'La categoría especificada no existe' });
            }
        }

        // Preparar datos de actualización
        const datosActualizacion = {
            ...req.body,
            precio: req.body.precio ? parseFloat(req.body.precio) : undefined,
            categoriaId: req.body.categoriaId ? parseInt(req.body.categoriaId) : undefined,
            imagen: req.file ? req.file.filename : undefined
        };

        console.log('Actualizando producto con datos:', datosActualizacion);
        const producto = await prisma.producto.update({
            where: { id: parseInt(id) },
            data: datosActualizacion
        });

        console.log('Producto actualizado exitosamente:', {
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoriaId
        });

        res.json(producto);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
};

// Eliminar un producto (soft delete)
const eliminarProducto = async (req, res) => {
    console.log('=== Inicio DELETE /api/tienda/productos/:id ===');
    const { id } = req.params;
    console.log('ID del producto a eliminar (soft delete):', id);

    try {
        if (!id || isNaN(parseInt(id))) {
            console.error('ID de producto inválido:', id);
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        // Verificar si el producto existe
        console.log('Verificando existencia del producto...');
        const productoExistente = await prisma.producto.findUnique({
            where: { id: parseInt(id) }
        });

        if (!productoExistente) {
            console.log('Producto no encontrado con ID:', id);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log('Realizando eliminación lógica del producto...');
        const producto = await prisma.producto.update({
            where: { id: parseInt(id) },
            data: { activo: false }
        });

        console.log('Producto marcado como inactivo exitosamente:', {
            id: producto.id,
            nombre: producto.nombre
        });

        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};

// Actualizar stock
const actualizarStock = async (req, res) => {
    console.log('=== Inicio PUT /api/tienda/productos/:id/stock ===');
    const { id } = req.params;
    const { cantidad } = req.body;
    console.log('Actualización de stock para producto ID:', id);
    console.log('Nueva cantidad:', cantidad);

    try {
        if (!id || isNaN(parseInt(id))) {
            console.error('ID de producto inválido:', id);
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        if (cantidad === undefined || isNaN(parseInt(cantidad))) {
            console.error('Cantidad inválida:', cantidad);
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        // Verificar si el producto existe
        console.log('Verificando existencia del producto...');
        const productoExistente = await prisma.producto.findUnique({
            where: { id: parseInt(id) }
        });

        if (!productoExistente) {
            console.log('Producto no encontrado con ID:', id);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log('Actualizando stock del producto...');
        const stock = await prisma.stock.update({
            where: { productoId: parseInt(id) },
            data: { cantidad: parseInt(cantidad) }
        });

        console.log('Stock actualizado exitosamente:', {
            productoId: stock.productoId,
            nuevaCantidad: stock.cantidad
        });

        res.json(stock);
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({ error: 'Error al actualizar el stock' });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    actualizarStock
}; 