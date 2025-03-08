const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middleware/auth');

// Ruta pública para crear el administrador inicial
router.post('/admin/inicial', usuarioController.crearAdminInicial);

// Ruta pública para login
router.post('/login', usuarioController.login);

// Rutas protegidas
router.use(verificarToken);

// Rutas que requieren autenticación
router.post('/', usuarioController.crearUsuario);
router.get('/', usuarioController.listarUsuarios);
router.get('/:id', usuarioController.obtenerUsuario);
router.put('/:id', usuarioController.actualizarUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;
