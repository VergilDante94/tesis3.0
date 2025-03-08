require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

console.log('Variables de entorno cargadas:', {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas
const usuarioRoutes = require('./routes/usuarioRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const ordenRoutes = require('./routes/ordenRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');

// Middleware de autenticación para rutas protegidas
app.use((req, res, next) => {
    const publicPaths = ['/login.html', '/registro.html', '/css', '/js/auth.js'];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));

    if (!isPublicPath && !req.path.startsWith('/api/')) {
        // Verificar token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.redirect('/login.html');
        }
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (error) {
            return res.redirect('/login.html');
        }
    } else {
        next();
    }
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Solo iniciar el servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}

module.exports = app;