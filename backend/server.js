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

// Rutas de ejemplo
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM Usuario', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Endpoint para obtener datos del usuario por ID
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

// Rutas de ejemplo
app.get('/api/ordenes', (req, res) => {
    // Aquí deberías implementar la lógica para obtener las órdenes de la base de datos
    res.json([{ id: 1, descripcion: 'Orden 1' }, { id: 2, descripcion: 'Orden 2' }]); // Simulación de datos
});

app.get('/api/servicios', (req, res) => {
    db.query('SELECT * FROM Servicios', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

app.get('/api/facturas', (req, res) => {
    // Aquí deberías implementar la lógica para obtener las facturas de la base de datos
    res.json([{ id: 1, monto: 100 }, { id: 2, monto: 200 }]); // Simulación de datos
});

app.get('/api/notificaciones', (req, res) => {
    // Aquí deberías implementar la lógica para obtener las notificaciones de la base de datos
    res.json([{ id: 1, mensaje: 'Notificación 1' }, { id: 2, mensaje: 'Notificación 2' }]); // Simulación de datos
});

// Ruta para servir las secciones
app.get('/ordenes', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'ordenes.html'));
});

app.get('/servicios', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'servicios.html'));
});

app.get('/facturas', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'facturas.html'));
});

app.get('/notificaciones', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'notificaciones.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});