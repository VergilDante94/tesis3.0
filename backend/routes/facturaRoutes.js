const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/orden/:ordenId',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['TRABAJADOR']),
    facturaController.generar
);
router.get('/:id', authMiddleware.verificarToken, facturaController.obtener);
router.get('/cliente/:clienteId', authMiddleware.verificarToken, facturaController.listarPorCliente);
router.get('/:id/pdf', authMiddleware.verificarToken, facturaController.descargarPDF);

module.exports = router;
