const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { autenticarToken } = require('../middleware/auth');

// Rutas para el dashboard
router.get('/estadisticas', autenticarToken, dashboardController.obtenerEstadisticas);
router.get('/actividad', autenticarToken, dashboardController.obtenerActividadReciente);
router.get('/graficos', autenticarToken, dashboardController.obtenerDatosGraficos);
router.get('/estado', autenticarToken, dashboardController.obtenerEstadoSistema);

module.exports = router; 