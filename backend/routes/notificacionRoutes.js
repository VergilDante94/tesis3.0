const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener notificaciones de un usuario
router.get('/usuario/:usuarioId', 
    authMiddleware.verificarToken, 
    notificacionController.obtenerPorUsuario
);

// Marcar notificación como leída
router.put('/:id/leer', 
    authMiddleware.verificarToken, 
    notificacionController.marcarComoLeida
);

// Marcar todas las notificaciones de un usuario como leídas
router.put('/usuario/:usuarioId/leer-todas', 
    authMiddleware.verificarToken, 
    notificacionController.marcarTodasComoLeidas
);

// Contar notificaciones no leídas de un usuario
router.get('/usuario/:usuarioId/no-leidas', 
    authMiddleware.verificarToken, 
    notificacionController.contarNoLeidas
);

// Crear una nueva notificación
router.post('/', 
    authMiddleware.verificarToken, 
    notificacionController.crear
);

// Eliminar una notificación
router.delete('/:id', 
    authMiddleware.verificarToken, 
    notificacionController.eliminar
);

// Crear notificación para todos los administradores
router.post('/admins', 
    authMiddleware.verificarToken, 
    notificacionController.notificarAdmins
);

module.exports = router;
