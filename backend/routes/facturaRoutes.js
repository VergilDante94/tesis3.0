const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para generar factura de una orden
router.post('/orden/:ordenId',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['ADMIN', 'TRABAJADOR', 'CLIENTE']), // Permitir a clientes generar sus propias facturas
    facturaController.generar
);

// Obtener una factura específica por ID
router.get('/:id', 
    authMiddleware.verificarToken, 
    facturaController.obtener
);

// Listar todas las facturas de un cliente
router.get('/cliente/:clienteId', 
    authMiddleware.verificarToken, 
    facturaController.listarPorCliente
);

// Descargar PDF de una factura
router.get('/:id/pdf', 
    authMiddleware.verificarToken, 
    facturaController.descargarPDF
);

// Listar todas las facturas (para administradores)
router.get('/', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['ADMIN', 'TRABAJADOR']),
    facturaController.listarTodas
);

module.exports = router;
