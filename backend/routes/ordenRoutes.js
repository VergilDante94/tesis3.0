const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware.verificarToken, ordenController.crear);
router.get('/', authMiddleware.verificarToken, ordenController.listar);
router.put('/:ordenId/trabajador', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['TRABAJADOR']),
    ordenController.asignarTrabajador
);
router.put('/:ordenId/estado',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['TRABAJADOR']),
    ordenController.actualizarEstado
);
router.put('/:ordenId/cancelar',
    authMiddleware.verificarToken,
    ordenController.cancelarOrden
);

module.exports = router;
