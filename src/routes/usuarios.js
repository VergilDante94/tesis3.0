const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario por email
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, usuario.contrasena);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email,
                tipo: usuario.tipo,
                nombre: usuario.nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router; 