const fetch = require('node-fetch');

async function probarCrearOrden() {
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
    const clienteToken = loginData.token;
    
    // Obtener servicios disponibles
    const serviciosResponse = await fetch('http://localhost:3000/api/servicios', {
      headers: {
        'Authorization': `Bearer ${clienteToken}`
      }
    });
    
    if (!serviciosResponse.ok) {
      const errorData = await serviciosResponse.json();
      throw new Error('Error al obtener servicios: ' + JSON.stringify(errorData));
    }
    
    const servicios = await serviciosResponse.json();
    console.log(`Se encontraron ${servicios.length} servicios disponibles`);
    
    if (servicios.length === 0) {
      // Crear un servicio de prueba si no hay ninguno
      const servicioResponse = await fetch('http://localhost:3000/api/servicios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clienteToken}`
        },
        body: JSON.stringify({
          nombre: 'Servicio de Prueba',
          descripcion: 'Servicio para pruebas',
          precioBase: 100,
          tipo: 'POR_HORA'
        })
      });
      
      if (!servicioResponse.ok) {
        const errorData = await servicioResponse.json();
        throw new Error('Error al crear servicio: ' + JSON.stringify(errorData));
      }
      
      const servicio = await servicioResponse.json();
      console.log('Servicio creado:', servicio);
      
      // Usar este servicio
      servicios.push(servicio);
    }
    
    const servicioElegido = servicios[0];
    console.log('Usando servicio:', servicioElegido);
    
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
      const errorText = await ordenResponse.text();
      throw new Error(`Error al crear orden (${ordenResponse.status}): ${errorText}`);
    }
    
    const ordenData = await ordenResponse.json();
    console.log('Orden creada exitosamente:', ordenData);
    
  } catch (error) {
    console.error('Error en el proceso:', error.message);
  }
}

probarCrearOrden(); 