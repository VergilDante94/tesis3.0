const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const authMiddleware = require('../middleware/authMiddleware');

// Listar todas las facturas (solo admin y trabajador)
router.get('/',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['ADMIN', 'TRABAJADOR']),
    facturaController.listarTodas
);

// Ruta para generar factura de una orden
router.post('/orden/:ordenId',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['ADMIN', 'TRABAJADOR', 'CLIENTE']),
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

// Descargar PDF directamente con token en URL (sin middleware de autenticación)
router.get('/:id/pdf-download', 
    facturaController.descargarPDFConToken
);

// Sincronizar estados de facturas con sus órdenes (solo admin)
router.post('/sync-estados', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['ADMIN']),
    facturaController.sincronizarEstadosFacturas
);

module.exports = router;
