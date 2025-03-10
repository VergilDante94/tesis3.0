const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');

app.use(express.json());
app.use(express.static('public'));

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Manejo de errores 404
app.use((req, res) => {
    console.log('Ruta no encontrada:', req.url);
    res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 