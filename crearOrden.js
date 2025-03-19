const fetch = require('node-fetch');

async function crearOrdenCliente() {
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
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error('Error en login: ' + JSON.stringify(loginData));
    }
    
    console.log('Login exitoso como cliente:', loginData.usuario);
    const clienteToken = loginData.token;
    
    // Obtener servicios disponibles
    const serviciosResponse = await fetch('http://localhost:3000/api/servicios', {
      headers: {
        'Authorization': `Bearer ${clienteToken}`
      }
    });
    
    const servicios = await serviciosResponse.json();
    if (!serviciosResponse.ok || !servicios.length) {
      throw new Error('No hay servicios disponibles');
    }
    
    console.log(`Se encontraron ${servicios.length} servicios disponibles`);
    const servicioElegido = servicios[0]; // Tomamos el primer servicio
    
    // Crear una orden
    const ordenResponse = await fetch('http://localhost:3000/api/ordenes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clienteToken}`
      },
      body: JSON.stringify({
        clienteId: loginData.usuario.id,
        servicios: [
          {
            servicioId: servicioElegido.id,
            cantidad: 1
          }
        ]
      })
    });
    
    if (!ordenResponse.ok) {
      const errorData = await ordenResponse.json();
      throw new Error('Error al crear orden: ' + JSON.stringify(errorData));
    }
    
    const ordenData = await ordenResponse.json();
    console.log('Orden creada exitosamente:', ordenData);
    
  } catch (error) {
    console.error('Error en el proceso:', error.message);
  }
}

crearOrdenCliente(); 