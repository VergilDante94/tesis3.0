const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verificarToken, esAdmin } = require('../middleware/auth');

// Importar controladores
const categoriaController = require('../controllers/tienda/categoriaController');
const productoController = require('../controllers/tienda/productoController');
const ventaController = require('../controllers/tienda/ventaController');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads/productos');
        console.log('Upload path:', uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generar un nombre de archivo único sin caracteres especiales
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${uniqueSuffix}${extension}`;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        console.log('File upload attempt:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            isValidMimetype: mimetype,
            isValidExtname: extname
        });

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(`Solo se permiten imágenes (jpeg, jpg, png, webp). Recibido: ${file.mimetype}`));
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('imagen');

// Middleware personalizado para manejar errores de multer
const handleUpload = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                error: `Error al subir el archivo: ${err.message}`,
                code: err.code
            });
        } else if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ 
                error: err.message
            });
        }
        next();
    });
};

// Rutas de Categorías
router.get('/categorias', categoriaController.obtenerCategorias);
router.get('/categorias/:id', categoriaController.obtenerCategoriaPorId);
router.post('/categorias', [verificarToken, esAdmin], categoriaController.crearCategoria);
router.put('/categorias/:id', [verificarToken, esAdmin], categoriaController.actualizarCategoria);
router.delete('/categorias/:id', [verificarToken, esAdmin], categoriaController.eliminarCategoria);

// Rutas de Productos
router.get('/productos', productoController.obtenerProductos);
router.get('/productos/:id', productoController.obtenerProductoPorId);
router.post('/productos', [verificarToken, esAdmin, handleUpload], productoController.crearProducto);
router.put('/productos/:id', [verificarToken, esAdmin, handleUpload], productoController.actualizarProducto);
router.delete('/productos/:id', [verificarToken, esAdmin], productoController.eliminarProducto);
router.put('/productos/:id/stock', [verificarToken, esAdmin], productoController.actualizarStock);

// Rutas de Ventas
router.get('/ventas', [verificarToken], ventaController.obtenerVentas);
router.get('/ventas/:id', [verificarToken], ventaController.obtenerVentaPorId);
router.post('/ventas', [verificarToken], ventaController.crearVenta);
router.put('/ventas/:id/estado', [verificarToken, esAdmin], ventaController.actualizarEstadoVenta);

module.exports = router; 