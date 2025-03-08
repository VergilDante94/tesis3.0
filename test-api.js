const path = require('path');
require('dotenv').config({ path: path.resolve('D:\\Tesis2.0\\.env') });

async function testAPI() {
    try {
        console.log('1. Probando login...');
        const loginResponse = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                contrasena: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('\nRespuesta del login:', loginData);

        if (!loginData.token) {
            console.error('No se recibió token');
            return;
        }

        console.log('\n2. Probando endpoint protegido (listar usuarios)...');
        const usersResponse = await fetch('http://localhost:3000/api/usuarios', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });

        const usersData = await usersResponse.json();
        console.log('\nLista de usuarios:', usersData);

    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI(); 