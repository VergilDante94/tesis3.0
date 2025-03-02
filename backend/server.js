const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Reemplaza con tu usuario
    password: 'Bryan940730*', // Reemplaza con tu contraseña
    database: 'gestion_servicios' // Reemplaza con tu base de datos
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html')); // Ajusta según la estructura
});

// Ruta para obtener información del usuario por ID
app.get('/api/usuario/:id', (req, res) => {
    const userId = req.params.id;

    db.query('SELECT * FROM Usuario WHERE idUsuario = ?', [userId], (err, userResults) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ error: 'Error al cargar los datos del usuario' });
        }
        if (userResults.length > 0) {
            const user = userResults[0];
            res.json({
                id: user.idUsuario,
                nombre: user.nombre,
                telefono: user.telefono,
                email: user.email,
                entidad: user.entidad,
                historialOrdenes: user.historialOrdenes,
                direccion: user.direccion
            });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    });
});

// Ruta para obtener todos los servicios
app.get('/api/servicios', (req, res) => {
    db.query('SELECT idServicio, nombre, descripcion, precioBase, departamento, tipoServicio FROM Servicios', (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ error: 'Error al cargar los servicios' });
        }
        res.json(results);
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});