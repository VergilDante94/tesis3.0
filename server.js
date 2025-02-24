const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Reemplaza con tu usuario de MySQL
    password: 'Bryan940730*', // Reemplaza con tu contraseña de MySQL
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
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para obtener datos del usuario por ID
app.get('/api/usuario/:id', (req, res) => {
    const userId = req.params.id;

    db.query('SELECT u.nombre, u.email, c.direccion, c.telefono FROM Usuario u JOIN Cliente c ON u.idUsuario = c.idUsuario WHERE u.idUsuario = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            res.json(results[0]); // Devuelve el primer usuario encontrado
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});