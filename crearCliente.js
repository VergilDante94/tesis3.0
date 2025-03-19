const fetch = require('node-fetch');

async function crearUsuarioCliente() {
  try {
    // Primero necesitamos iniciar sesión como admin
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error('Error en login: ' + JSON.stringify(loginData));
    }
    
    console.log('Login exitoso como admin');
    const adminToken = loginData.token;
    
    // Ahora creamos un usuario cliente
    const clienteResponse = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        tipo: 'CLIENTE',
        password: 'cliente123',
        direccion: 'Calle Test 123',
        telefono: '123456789'
      })
    });
    
    const clienteData = await clienteResponse.json();
    if (!clienteResponse.ok) {
      throw new Error('Error al crear cliente: ' + JSON.stringify(clienteData));
    }
    
    console.log('Cliente creado exitosamente:', clienteData);
    console.log('Ahora puede iniciar sesión con:');
    console.log('Email: cliente@test.com');
    console.log('Password: cliente123');
  } catch (error) {
    console.error('Error en el proceso:', error.message);
  }
}

crearUsuarioCliente(); 