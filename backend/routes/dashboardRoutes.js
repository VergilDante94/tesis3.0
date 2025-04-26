const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middleware/auth');

// Rutas para el dashboard
router.get('/estadisticas', verificarToken, dashboardController.obtenerEstadisticas);
router.get('/actividad', verificarToken, dashboardController.obtenerActividadReciente);
router.get('/graficos', verificarToken, dashboardController.obtenerDatosGraficos);
router.get('/estado', verificarToken, dashboardController.obtenerEstadoSistema);

module.exports = router; 