const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            include: {
                _count: {
                    select: { productos: true }
                }
            }
        });
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
};

// Obtener una categoría por ID
const obtenerCategoriaPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const categoria = await prisma.categoria.findUnique({
            where: { id: parseInt(id) },
            include: {
                productos: true
            }
        });
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json(categoria);
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        res.status(500).json({ error: 'Error al obtener la categoría' });
    }
};

// Crear una nueva categoría
const crearCategoria = async (req, res) => {
    const { nombre, descripcion } = req.body;
    try {
        const categoria = await prisma.categoria.create({
            data: {
                nombre,
                descripcion
            }
        });
        res.status(201).json(categoria);
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
};

// Actualizar una categoría
const actualizarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        const categoria = await prisma.categoria.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion
            }
        });
        res.json(categoria);
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
};

// Eliminar una categoría
const eliminarCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.categoria.delete({
            where: { id: parseInt(id) }
        });
        res.json({ mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
};

module.exports = {
    obtenerCategorias,
    obtenerCategoriaPorId,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
}; 