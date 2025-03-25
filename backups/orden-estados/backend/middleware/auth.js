const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

const esAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (req.usuario.tipo !== 'ADMIN') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }

    next();
};

module.exports = {
    verificarToken,
    esAdmin
}; 