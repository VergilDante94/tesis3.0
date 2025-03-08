const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/usuario/:usuarioId', 
    authMiddleware.verificarToken, 
    notificacionController.obtenerPorUsuario
);
router.put('/:id/leer', 
    authMiddleware.verificarToken, 
    notificacionController.marcarComoLeida
);
router.put('/usuario/:usuarioId/leer-todas', 
    authMiddleware.verificarToken, 
    notificacionController.marcarTodasComoLeidas
);

module.exports = router;
