const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las ventas
const obtenerVentas = async (req, res) => {
    try {
        const ventas = await prisma.venta.findMany({
            include: {
                cliente: {
                    include: {
                        usuario: true
                    }
                },
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        });
        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ error: 'Error al obtener las ventas' });
    }
};

// Obtener una venta por ID
const obtenerVentaPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const venta = await prisma.venta.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: {
                    include: {
                        usuario: true
                    }
                },
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        });
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        res.json(venta);
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ error: 'Error al obtener la venta' });
    }
};

// Crear una nueva venta
const crearVenta = async (req, res) => {
    const { clienteId, detalles } = req.body;

    try {
        // Iniciar transacción
        const resultado = await prisma.$transaction(async (prisma) => {
            // Verificar stock de productos y obtener nombres de productos
            const productosInfo = {};
            for (const detalle of detalles) {
                // Si recibimos el nombre del producto directamente, úsalo
                if (detalle.productoNombre) {
                    productosInfo[detalle.productoId] = detalle.productoNombre;
                } else {
                    // Si no, búscalo en la base de datos como fallback
                    const producto = await prisma.producto.findUnique({
                        where: { id: detalle.productoId }
                    });
                    
                    if (!producto) {
                        throw new Error(`Producto no encontrado: ${detalle.productoId}`);
                    }
                    
                    productosInfo[detalle.productoId] = producto.nombre;
                }
                
                const stock = await prisma.stock.findUnique({
                    where: { productoId: detalle.productoId }
                });
                
                if (!stock || stock.cantidad < detalle.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${productosInfo[detalle.productoId]}`);
                }
            }

            // Calcular total y crear venta
            let total = 0;
            const detallesConSubtotal = detalles.map(detalle => {
                const subtotal = detalle.precioUnitario * detalle.cantidad;
                total += subtotal;
                return {
                    ...detalle,
                    subtotal
                };
            });

            // Crear la venta
            const nuevaVenta = await prisma.venta.create({
                data: {
                    clienteId: parseInt(clienteId),
                    total,
                    detalles: {
                        create: detallesConSubtotal.map(detalle => ({
                            productoId: parseInt(detalle.productoId),
                            cantidad: parseInt(detalle.cantidad),
                            precioUnitario: parseFloat(detalle.precioUnitario),
                            subtotal: detalle.subtotal
                        }))
                    }
                },
                include: {
                    detalles: {
                        include: {
                            producto: true
                        }
                    }
                }
            });

            // Crear la orden asociada - Usar los nombres de productos obtenidos anteriormente
            const descripcionOrden = detallesConSubtotal.map(detalle => 
                `${detalle.cantidad}x ${productosInfo[detalle.productoId]}`
            ).join(', ');

            const nuevaOrden = await prisma.orden.create({
                data: {
                    clienteId: parseInt(clienteId),
                    estado: "PENDIENTE",
                    tipo: "COMPRA",
                    descripcion: `Compra de productos: ${descripcionOrden}`,
                    ventaId: nuevaVenta.id
                }
            });

            // Actualizar stock
            for (const detalle of detalles) {
                await prisma.stock.update({
                    where: { productoId: parseInt(detalle.productoId) },
                    data: {
                        cantidad: {
                            decrement: parseInt(detalle.cantidad)
                        }
                    }
                });
            }

            return {
                venta: nuevaVenta,
                orden: nuevaOrden
            };
        });

        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al crear venta:', error);
        res.status(500).json({ error: error.message || 'Error al crear la venta' });
    }
};

// Actualizar estado de una venta
const actualizarEstadoVenta = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const venta = await prisma.venta.update({
            where: { id: parseInt(id) },
            data: { estado }
        });
        res.json(venta);
    } catch (error) {
        console.error('Error al actualizar estado de venta:', error);
        res.status(500).json({ error: 'Error al actualizar el estado de la venta' });
    }
};

module.exports = {
    obtenerVentas,
    obtenerVentaPorId,
    crearVenta,
    actualizarEstadoVenta
}; 