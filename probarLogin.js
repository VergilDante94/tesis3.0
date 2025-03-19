const fetch = require('node-fetch');

async function probarLogin() {
  try {
    // Iniciar sesión como cliente
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'cliente@test.com',
        password: 'cliente123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error('Error en login: ' + JSON.stringify(errorData));
    }
    
    const loginData = await loginResponse.json();
    console.log('Login exitoso!');
    console.log('Token:', loginData.token);
    console.log('Usuario:', loginData.usuario);
    
  } catch (error) {
    console.error('Error en el proceso:', error.message);
  }
}

probarLogin(); 