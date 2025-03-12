const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta de login
router.post('/login', usuarioController.login);

// Ruta para crear el administrador inicial
router.post('/admin/inicial', usuarioController.crearAdminInicial);

module.exports = router; 