const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas protegidas que requieren autenticación
router.post('/', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['TRABAJADOR']),
    (req, res) => servicioController.crear(req, res)
);

router.get('/', (req, res) => servicioController.listar(req, res));
router.get('/:id', (req, res) => servicioController.obtener(req, res));

router.put('/:id', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['TRABAJADOR']),
    (req, res) => servicioController.actualizar(req, res)
);

router.delete('/:id', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['TRABAJADOR']),
    (req, res) => servicioController.eliminar(req, res)
);

module.exports = router;
