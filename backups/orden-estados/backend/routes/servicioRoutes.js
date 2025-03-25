const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const jwt = require('jsonwebtoken');

// Middleware verificarToken
const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Middleware verificarRol
const verificarAdmin = (req, res, next) => {
    if (req.usuario.tipo !== 'ADMIN') {
        return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
    }
    next();
};

// Rutas para servicios
router.get('/debug/system', verificarToken, (req, res) => servicioController.debug(req, res));
router.get('/', verificarToken, (req, res) => servicioController.listar(req, res));
router.get('/:id', verificarToken, (req, res) => servicioController.obtener(req, res));
router.post('/', verificarToken, verificarAdmin, (req, res) => servicioController.crear(req, res));
router.put('/:id', verificarToken, verificarAdmin, (req, res) => servicioController.actualizar(req, res));
router.delete('/:id', verificarToken, verificarAdmin, (req, res) => servicioController.eliminar(req, res));

module.exports = router;
