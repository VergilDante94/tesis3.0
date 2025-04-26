require('dotenv').config();
const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const prisma = new PrismaClient();
const servicioRoutes = require('../backend/routes/servicioRoutes');
const facturaRoutes = require('../backend/routes/facturaRoutes');
const tiendaRoutes = require('../backend/routes/tiendaRoutes');
const notificacionRoutes = require('../backend/routes/notificacionRoutes');
const dashboardRoutes = require('../backend/routes/dashboardRoutes');
const fs = require('fs');

// Registrar el tiempo de inicio del servidor
process.env.SERVER_START_TIME = new Date().toISOString();

// Middleware
app.use(express.json());

// Asegurarse de que el directorio de facturas exista
const facturasDir = path.join(__dirname, '../public/facturas');
if (!fs.existsSync(facturasDir)) {
    fs.mkdirSync(facturasDir, { recursive: true });
}

// Asegurarse de que el directorio de uploads para productos exista
const uploadsProductosDir = path.join(__dirname, '../public/uploads/productos');
if (!fs.existsSync(uploadsProductosDir)) {
    fs.mkdirSync(uploadsProductosDir, { recursive: true });
}

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/facturas', express.static(facturasDir, {
    setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment');
        }
    }
}));

// Middleware para verificar token
const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al verificar token' });
    }
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Intento de login para:', email);
        
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            console.log('Usuario no encontrado:', email);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('Usuario encontrado:', usuario.email);
        const validPassword = await bcrypt.compare(password, usuario.contrasena);
        
        if (!validPassword) {
            console.log('Contraseña inválida para:', email);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('Contraseña válida para:', email);
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

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                tipo: usuario.tipo,
                direccion: usuario.direccion || '',
                telefono: usuario.telefono || ''
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para actualizar el perfil del usuario
app.put('/api/usuarios/me', verificarToken, async (req, res) => {
    try {
        console.log('Petición de actualización recibida:');
        console.log('Headers:', req.headers);
        console.log('Body completo:', req.body);
        
        const { nombre, direccion, telefono, password } = req.body;
        const usuarioId = req.user.id;
        
        console.log(`Actualizando perfil de usuario ID ${usuarioId} con datos:`, { 
            nombre, 
            direccion, 
            telefono,
            password: password ? '[PRESENTE]' : '[NO PRESENTE]'
        });
        
        // Construir objeto de actualización - asegurarse que los campos estén definidos
        const updateData = {};
        
        // Asignar explícitamente cada campo solo si está presente
        if (nombre !== undefined) updateData.nombre = String(nombre);
        if (direccion !== undefined) updateData.direccion = String(direccion);
        if (telefono !== undefined) updateData.telefono = String(telefono);
        
        // Si hay password, añadirlo encriptado
        if (password) {
            updateData.contrasena = await bcrypt.hash(password, 10);
        }
        
        console.log('Datos de actualización finales:', updateData);
        
        // Actualizar el usuario directamente usando Prisma - usar transacción para garantizar consistencia
        const usuario = await prisma.$transaction(async (tx) => {
            // Actualizar usuario
            const updatedUser = await tx.usuario.update({
                where: { id: usuarioId },
                data: updateData
            });
            
            // También actualizar la tabla cliente si existe
            const cliente = await tx.cliente.findUnique({
                where: { usuarioId: usuarioId }
            });
            
            if (cliente && (direccion !== undefined || telefono !== undefined)) {
                const clienteUpdateData = {};
                if (direccion !== undefined) clienteUpdateData.direccion = String(direccion);
                if (telefono !== undefined) clienteUpdateData.telefono = String(telefono);
                
                await tx.cliente.update({
                    where: { id: cliente.id },
                    data: clienteUpdateData
                });
                console.log('Actualizada la información de cliente asociada');
            }
            
            return updatedUser;
        });
        
        console.log('Usuario actualizado con éxito:', usuario);
        res.json(usuario);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ 
            error: 'Error al actualizar el perfil', 
            detalle: error.message,
            stack: error.stack
        });
    }
});

// Ruta para obtener información del usuario actual
app.get('/api/usuarios/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                nombre: true,
                tipo: true,
                direccion: true,
                telefono: true
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Rutas de servicios
app.use('/api/servicios', servicioRoutes);

// Rutas de facturas
app.use('/api/facturas', facturaRoutes);

// Rutas de tienda
app.use('/api/tienda', tiendaRoutes);

// Rutas de notificaciones
app.use('/api/notificaciones', notificacionRoutes);

// Rutas de dashboard
app.use('/api/dashboard', dashboardRoutes);

// Rutas de órdenes
app.post('/api/ordenes', verificarToken, async (req, res) => {
  try {
    const { clienteId, servicios, fechaProgramada, descripcion } = req.body;
    console.log('Creando orden:', { clienteId, servicios, fechaProgramada, descripcion });

    // Buscar el cliente directamente por su ID
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Validar que la fecha programada no sea anterior a la fecha actual
    if (fechaProgramada) {
      const fechaActual = new Date();
      const fechaSeleccionada = new Date(fechaProgramada);
      
      if (fechaSeleccionada < fechaActual) {
        return res.status(400).json({ error: 'La fecha programada no puede ser anterior a la fecha actual' });
      }
      
      // Validar que la hora esté dentro del horario permitido (7:00 AM - 5:00 PM)
      const hora = fechaSeleccionada.getHours();
      const minutos = fechaSeleccionada.getMinutes();
      
      if (hora < 7 || (hora === 17 && minutos > 0) || hora > 17) {
        return res.status(400).json({ error: 'El horario de programación debe estar entre las 7:00 AM y las 5:00 PM' });
      }
    }

    const orden = await prisma.orden.create({
      data: {
        clienteId: cliente.id,
        estado: 'PENDIENTE',
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        descripcion: descripcion || '',
        servicios: {
          create: servicios.map(s => ({
            servicioId: s.servicioId,
            cantidad: s.cantidad,
            precioUnitario: 0 // Será actualizado después
          }))
        }
      },
      include: {
        cliente: true,
        servicios: {
          include: {
            servicio: true
          }
        }
      }
    });

    // Actualizar precios unitarios para cada servicio en la orden
    for (const ordenServicio of orden.servicios) {
      await prisma.ordenServicio.update({
        where: { id: ordenServicio.id },
        data: {
          precioUnitario: ordenServicio.servicio.precioBase
        }
      });
    }

    // Crear notificación de nueva orden
    await prisma.notificacion.create({
      data: {
        usuarioId: cliente.usuarioId,
        mensaje: `Nueva orden creada #${orden.id}`,
        tipo: 'ORDEN',
        enlaceId: orden.id,
        enlaceTipo: 'ORDEN'
      }
    });

    res.status(201).json(orden);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

// Ruta para obtener órdenes
app.get('/api/ordenes', async (req, res) => {
  console.log('=== Inicio de solicitud GET /api/ordenes ===');
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Error: No se proporcionó encabezado de autorización');
      return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Error: Token no proporcionado en el encabezado');
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioId = decoded.id;
    const tipo = decoded.tipo;
    console.log('Usuario autenticado:', { id: usuarioId, tipo });

    // Parámetros de filtrado
    const { 
      estado, 
      fechaDesde, 
      fechaHasta, 
      servicioId,
      clienteId,
      precioMinimo,
      precioMaximo,
      ordenarPor = 'fecha',
      ordenDireccion = 'desc',
      tipo: tipoOrden
    } = req.query;
    
    console.log('Filtros recibidos:', {
      estado,
      fechaDesde,
      fechaHasta,
      servicioId,
      clienteId,
      precioMinimo,
      precioMaximo,
      ordenarPor,
      ordenDireccion,
      tipoOrden
    });

    // Construir condiciones de filtrado
    let whereCondition = {};
    
    // Filtro por estado
    if (estado) {
      whereCondition.estado = estado;
    }

    // Filtro por tipo de orden
    if (tipoOrden) {
      whereCondition.tipo = tipoOrden;
    }
    
    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      whereCondition.fecha = {};
      if (fechaDesde) {
        whereCondition.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        whereCondition.fecha.lte = new Date(fechaHasta);
      }
    }

    console.log('Condiciones de búsqueda:', whereCondition);

    // Configurar ordenamiento
    let orderBy = {};
    if (ordenarPor === 'precio') {
      // Para ordenar por precio, necesitamos procesar después
      orderBy.fecha = ordenDireccion;
    } else {
      orderBy[ordenarPor] = ordenDireccion;
    }

    // Si es ADMIN o TRABAJADOR, mostrar todas las órdenes (con filtros)
    if (tipo === 'ADMIN' || tipo === 'TRABAJADOR') {
      // Filtro adicional por cliente para admins/trabajadores
      if (clienteId) {
        whereCondition.clienteId = parseInt(clienteId);
      }
      
      ordenes = await prisma.orden.findMany({
        where: whereCondition,
        include: {
          cliente: {
            include: {
              usuario: true
            }
          },
          servicios: {
            include: {
              servicio: true
            }
          }
        },
        orderBy
      });
    } 
    // Si es CLIENTE, mostrar solo sus órdenes
    else if (tipo === 'CLIENTE') {
      // Buscar el cliente asociado al usuario
      const cliente = await prisma.cliente.findUnique({
        where: { usuarioId: parseInt(usuarioId) }
      });

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado para este usuario' });
      }

      // Añadir clienteId a las condiciones de búsqueda
      whereCondition.clienteId = cliente.id;

      ordenes = await prisma.orden.findMany({
        where: whereCondition,
        include: {
          cliente: {
            include: {
              usuario: true
            }
          },
          servicios: {
            include: {
              servicio: true
            }
          }
        },
        orderBy
      });
    } else {
      return res.status(403).json({ message: 'Tipo de usuario no autorizado' });
    }

    // Filtrado posterior a la consulta
    let ordenesFiltradas = ordenes;
    
    // Filtrar por servicio específico si se solicita
    if (servicioId) {
      const servicioIdInt = parseInt(servicioId);
      ordenesFiltradas = ordenesFiltradas.filter(orden => 
        orden.servicios.some(s => s.servicioId === servicioIdInt)
      );
    }

    // Calcular el precio total para cada orden
    const ordenesConPrecios = ordenesFiltradas.map(orden => {
      // Calcular subtotal
      const subtotal = orden.servicios.reduce((sum, item) => 
        sum + (item.cantidad * item.precioUnitario), 0);
      
      // Ya no calculamos impuestos
      
      // Calcular total (ahora igual al subtotal)
      const total = subtotal;
      
      // Añadir información de precios a la orden
      return {
        ...orden,
        precios: {
          subtotal: subtotal,
          total: total
        },
        // Formatear fecha para mejor visualización
        fechaFormateada: new Date(orden.fecha).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        // Añadir fecha programada formateada
        fechaProgramadaFormateada: orden.fechaProgramada ? 
          new Date(orden.fechaProgramada).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'No programada'
      };
    });

    // Filtrar por rango de precios si se solicita
    let resultadoFinal = ordenesConPrecios;
    
    if (precioMinimo || precioMaximo) {
      resultadoFinal = ordenesConPrecios.filter(orden => {
        if (precioMinimo && orden.precios.total < parseFloat(precioMinimo)) {
          return false;
        }
        if (precioMaximo && orden.precios.total > parseFloat(precioMaximo)) {
          return false;
        }
        return true;
      });
    }

    // Ordenar por precio si se solicitó
    if (ordenarPor === 'precio') {
      resultadoFinal.sort((a, b) => {
        return ordenDireccion === 'asc' 
          ? a.precios.total - b.precios.total 
          : b.precios.total - a.precios.total;
      });
    }

    res.json(resultadoFinal);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// Ruta para obtener una orden específica por ID
app.get('/api/ordenes/:id', async (req, res) => {
  console.log('=== Inicio de solicitud GET /api/ordenes/:id ===');
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Error: No se proporcionó encabezado de autorización');
      return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Error: Token no proporcionado en el encabezado');
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioId = decoded.id;
    const tipo = decoded.tipo;
    console.log('Usuario autenticado:', { id: usuarioId, tipo });
    
    const { id } = req.params;
    console.log('ID de orden solicitada:', id);

    // Validar que id exista y sea un número válido
    if (!id || isNaN(parseInt(id))) {
      console.log('Error: ID de orden inválido:', id);
      return res.status(400).json({ error: 'ID de orden inválido' });
    }
    const ordenId = parseInt(id);

    // Buscar la orden
    console.log('Buscando orden en la base de datos...');
    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        cliente: {
          include: {
            usuario: true
          }
        },
        servicios: {
          include: {
            servicio: true
          }
        }
      }
    });

    if (!orden) {
      console.log('Error: Orden no encontrada:', ordenId);
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    console.log('Orden encontrada:', {
      id: orden.id,
      tipo: orden.tipo,
      estado: orden.estado,
      clienteId: orden.clienteId,
      servicios: orden.servicios?.length || 0
    });

    // Verificar permisos
    if (tipo === 'CLIENTE') {
      console.log('Verificando permisos para cliente...');
      // Buscar el cliente asociado al usuario
      const cliente = await prisma.cliente.findUnique({
        where: { usuarioId: parseInt(usuarioId) }
      });

      if (!cliente || cliente.id !== orden.clienteId) {
        console.log('Error: Cliente no autorizado:', {
          clienteId: cliente?.id,
          ordenClienteId: orden.clienteId
        });
        return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
      }
      console.log('Permisos verificados correctamente');
    }
    
    // Helper function para obtener información de precio de producto
    async function obtenerPrecioProducto(nombreProducto) {
      console.log(`Buscando precio para producto: "${nombreProducto}"`);
      try {
        // Intentar buscar el producto en la base de datos por nombre
        const productos = await prisma.producto.findMany({
          where: {
            nombre: {
              contains: nombreProducto
            },
            activo: true
          }
        });
        
        if (productos && productos.length > 0) {
          console.log(`Productos encontrados para "${nombreProducto}":`, 
            productos.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio })));
          
          // Usar el primer producto encontrado para el precio
          return {
            encontrado: true,
            precio: productos[0].precio,
            nombre: productos[0].nombre,
            id: productos[0].id
          };
        }
        
        // Si no se encuentra, usar lógica de fallback
        console.log(`No se encontraron productos con nombre "${nombreProducto}"`);
        
        if (nombreProducto.includes('Seagate') || nombreProducto.includes('disco duro')) {
          console.log('Usando precio fijo para disco duro');
          return { encontrado: true, precio: 60.00, nombre: nombreProducto };
        } else if (nombreProducto.includes('Teclado') || nombreProducto.includes('teclado')) {
          console.log('Usando precio fijo para teclado');
          return { encontrado: true, precio: 25.00, nombre: nombreProducto };
        }
        
        return { encontrado: false };
      } catch (error) {
        console.error(`Error al buscar precio para "${nombreProducto}":`, error);
        return { encontrado: false, error: error.message };
      }
    }
    
    // Calcular precios
    console.log('Calculando precios...');
    let subtotal = 0;
    let total = 0;

    if (orden.tipo === 'SERVICIO') {
      subtotal = orden.servicios.reduce((sum, item) => 
        sum + (item.cantidad * (item.precioUnitario || 0)), 0);
      total = subtotal;
      console.log('Precios calculados para servicios:', { subtotal, total });
    } else if (orden.tipo === 'COMPRA') {
      // Para compras, intentar obtener precios de productos
      console.log('Calculando precios para compra...');
      try {
        if (orden.detalles && orden.detalles.length > 0) {
          console.log('Detalles de productos encontrados:', orden.detalles);
          // Calcular basado en detalles estructurados
          total = orden.detalles.reduce((sum, detalle) => {
            const precio = detalle.precioUnitario || 0;
            return sum + (precio * (detalle.cantidad || 1));
          }, 0);
        } else if (orden.descripcion) {
          console.log('Procesando descripción para encontrar productos:', orden.descripcion);
          
          // Intentar extraer nombres de productos
          let productosEncontrados = [];
          
          // Buscar patrones de cantidad x producto
          const cantidadProductoPattern = /(\d+)x\s+([^,]+)/g;
          let match;
          let promises = [];
          
          while ((match = cantidadProductoPattern.exec(orden.descripcion)) !== null) {
            const cantidad = parseInt(match[1]);
            const nombreProducto = match[2].trim();
            console.log(`Patrón encontrado: ${cantidad}x ${nombreProducto}`);
            
            // Crear promesa para buscar precio
            promises.push(
              obtenerPrecioProducto(nombreProducto)
                .then(resultado => {
                  if (resultado.encontrado) {
                    productosEncontrados.push({
                      nombre: resultado.nombre || nombreProducto,
                      precio: resultado.precio,
                      cantidad: cantidad,
                      id: resultado.id
                    });
                    console.log(`Producto añadido: ${cantidad}x ${resultado.nombre || nombreProducto} a $${resultado.precio}`);
                  }
                })
            );
          }
          
          // Esperar a que todas las búsquedas terminen
          await Promise.all(promises);
          
          // Calcular total basado en productos encontrados
          if (productosEncontrados.length > 0) {
            console.log('Productos encontrados para cálculo de precio:', productosEncontrados);
            total = productosEncontrados.reduce((sum, producto) => 
              sum + (producto.precio * producto.cantidad), 0);
          } else {
            console.log('No se encontraron productos con precios definidos, usando fallback');
            // Fallback: procesar descripción para productos específicos
            if (orden.descripcion.includes('Seagate BarraCuda')) {
              total += 60.00;
              console.log('Añadido precio de Seagate BarraCuda: $60.00');
            } 
            
            if (orden.descripcion.includes('Teclado retroiluminado')) {
              total += 25.00;
              console.log('Añadido precio de Teclado retroiluminado: $25.00');
            }
          }
        }
        console.log('Total calculado para compra:', total);
      } catch (error) {
        console.error('Error al calcular precios de compra:', error);
      }
    }

    // Preparar respuesta
    const respuesta = {
      ...orden,
      precios: {
        subtotal,
        total
      }
    };
    console.log('Enviando respuesta con precios:', respuesta.precios);
    res.json(respuesta);

  } catch (error) {
    console.error('Error al procesar la solicitud de orden:', error);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// Añadir ruta GET para obtener usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        // Verificar el token y el tipo de usuario
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.params;
        
        // Verificar permisos - solo el propio usuario o un administrador puede ver detalles
        if (decoded.id !== parseInt(id) && decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'No tiene permisos para ver este usuario' });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                trabajador: true
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Remover campos sensibles
        delete usuario.contrasena;

        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        // Obtener solo usuarios activos (a menos que se especifique lo contrario)
        const mostrarInactivos = req.query.mostrarInactivos === 'true';
        const whereCondition = mostrarInactivos ? {} : { activo: true };

        const usuarios = await prisma.usuario.findMany({
            where: whereCondition,
            include: {
                cliente: true,
                trabajador: true
            }
        });

        // Eliminar información sensible antes de enviar la respuesta
        const usuariosSeguros = usuarios.map(usuario => {
            const usuarioSeguro = { ...usuario };
            delete usuarioSeguro.contrasena;
            return usuarioSeguro;
        });

        res.json(usuariosSeguros);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

// Ruta para crear usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { nombre, email, tipo, password, direccion, telefono, posicion, departamento } = req.body;

        if (!nombre || !email || !tipo || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Usar transacción para crear usuario y sus registros relacionados
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear el usuario base
            const nuevoUsuario = await tx.usuario.create({
                data: {
                    nombre,
                    email,
                    tipo,
                    contrasena: hashedPassword,
                    direccion,
                    telefono,
                    createdBy: decoded.id
                },
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    tipo: true,
                    direccion: true,
                    telefono: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            // 2. Si es CLIENTE, crear registro en tabla Cliente
            if (tipo === 'CLIENTE') {
                await tx.cliente.create({
                    data: {
                        usuarioId: nuevoUsuario.id,
                        direccion: direccion || '',
                        telefono: telefono || ''
                    }
                });
                console.log(`Registro de Cliente creado para usuario ID ${nuevoUsuario.id}`);
            }

            // 3. Si es TRABAJADOR, crear registro en tabla Trabajador
            if (tipo === 'TRABAJADOR') {
                await tx.trabajador.create({
                    data: {
                        usuarioId: nuevoUsuario.id,
                        posicion: posicion || '',
                        departamento: departamento || ''
                    }
                });
                console.log(`Registro de Trabajador creado para usuario ID ${nuevoUsuario.id}`);
            }

            return nuevoUsuario;
        });

        console.log('Usuario creado exitosamente:', resultado);
        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al crear usuario', 
            error: error.message
        });
    }
});

// Ruta para actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;
        const { nombre, email, tipo, password, direccion, telefono, posicion, departamento } = req.body;

        const userId = parseInt(id);
        
        // Buscar usuario para conocer su tipo actual
        const usuarioActual = await prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                cliente: true,
                trabajador: true
            }
        });
        
        if (!usuarioActual) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Actualización en transacción
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Preparar datos básicos del usuario para actualización
            const updateData = {
                nombre,
                email,
                tipo,
                direccion,
                telefono
            };

            // 2. Si se proporciona una nueva contraseña, actualizarla
            if (password) {
                updateData.contrasena = await bcrypt.hash(password, 10);
            }

            // 3. Actualizar el usuario base
            const usuarioActualizado = await tx.usuario.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    tipo: true,
                    direccion: true,
                    telefono: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            
            // 4. Gestionar cambio de tipo (si aplica)
            
            // Si el usuario era CLIENTE pero ahora es otro tipo, no eliminar el registro
            // pero sí actualizar sus datos si sigue siendo CLIENTE
            if (usuarioActual.cliente) {
                if (tipo === 'CLIENTE') {
                    // Actualizar datos del cliente
                    await tx.cliente.update({
                        where: { usuarioId: userId },
                        data: {
                            direccion: direccion || usuarioActual.cliente.direccion,
                            telefono: telefono || usuarioActual.cliente.telefono
                        }
                    });
                    console.log(`Actualizado cliente ID ${usuarioActual.cliente.id}`);
                }
            } else if (tipo === 'CLIENTE') {
                // Era otro tipo y ahora es CLIENTE, crear registro
                await tx.cliente.create({
                    data: {
                        usuarioId: userId,
                        direccion: direccion || '',
                        telefono: telefono || ''
                    }
                });
                console.log(`Nuevo registro de Cliente creado para usuario ID ${userId}`);
            }
            
            // Si el usuario era TRABAJADOR pero ahora es otro tipo, no eliminar el registro
            // pero sí actualizar sus datos si sigue siendo TRABAJADOR
            if (usuarioActual.trabajador) {
                if (tipo === 'TRABAJADOR') {
                    // Actualizar datos del trabajador
                    await tx.trabajador.update({
                        where: { usuarioId: userId },
                        data: {
                            posicion: posicion || usuarioActual.trabajador.posicion,
                            departamento: departamento || usuarioActual.trabajador.departamento
                        }
                    });
                    console.log(`Actualizado trabajador ID ${usuarioActual.trabajador.id}`);
                }
            } else if (tipo === 'TRABAJADOR') {
                // Era otro tipo y ahora es TRABAJADOR, crear registro
                await tx.trabajador.create({
                    data: {
                        usuarioId: userId,
                        posicion: posicion || '',
                        departamento: departamento || ''
                    }
                });
                console.log(`Nuevo registro de Trabajador creado para usuario ID ${userId}`);
            }
            
            return usuarioActualizado;
        });

        res.json(resultado);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al actualizar usuario',
            error: error.message 
        });
    }
});

// Ruta para eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;

        // No permitir eliminar al propio usuario administrador
        if (parseInt(id) === decoded.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
        }

        // En lugar de eliminar, marcar como inactivo
        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { activo: false }
        });

        res.json({ message: 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al desactivar usuario' });
    }
});

// Ruta para mostrar y actualizar el usuario administrador (temporal)
app.get('/api/admin-info', async (req, res) => {
    try {
        const adminUser = await prisma.usuario.findFirst({
            where: { tipo: 'ADMIN' },
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!adminUser) {
            return res.status(404).json({ message: 'No se encontró un usuario administrador' });
        }

        console.log('Datos del administrador:', adminUser);
        res.json(adminUser);
    } catch (error) {
        console.error('Error al obtener usuario administrador:', error);
        res.status(500).json({ message: 'Error al obtener usuario administrador' });
    }
});

app.put('/api/admin-info', async (req, res) => {
    try {
        const adminUser = await prisma.usuario.findFirst({
            where: { tipo: 'ADMIN' }
        });

        if (!adminUser) {
            return res.status(404).json({ message: 'No se encontró un usuario administrador' });
        }

        // Actualizar solo el nombre
        const updatedAdmin = await prisma.usuario.update({
            where: { id: adminUser.id },
            data: {
                nombre: req.body.nombre || adminUser.nombre
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log('Administrador actualizado:', updatedAdmin);
        res.json(updatedAdmin);
    } catch (error) {
        console.error('Error al actualizar usuario administrador:', error);
        res.status(500).json({ message: 'Error al actualizar usuario administrador' });
    }
});

// Ruta temporal para mostrar todos los usuarios (solo para depuración)
app.get('/api/debug/usuarios', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                tipo: true,
                direccion: true,
                telefono: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log('Tabla de usuarios:', usuarios);
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// Ruta para eliminar usuario FÍSICAMENTE (solo admin y con confirmación especial)
app.delete('/api/usuarios/:id/permanente', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;
        const { confirmacion } = req.body;

        // Requerir una confirmación específica
        if (confirmacion !== 'ELIMINAR_PERMANENTEMENTE') {
            return res.status(400).json({ message: 'Se requiere confirmación especial para esta acción' });
        }

        // No permitir eliminar al propio usuario administrador
        if (parseInt(id) === decoded.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
        }

        try {
            // 1. Eliminar notificaciones del usuario
            await prisma.notificacion.deleteMany({
                where: { usuarioId: parseInt(id) }
            });

            // 2. Verificar si es cliente y eliminar registros asociados
            const cliente = await prisma.cliente.findUnique({
                where: { usuarioId: parseInt(id) }
            });

            if (cliente) {
                // Eliminar facturas de órdenes del cliente
                const ordenes = await prisma.orden.findMany({
                    where: { clienteId: cliente.id }
                });

                for (const orden of ordenes) {
                    // Eliminar la factura si existe
                    await prisma.factura.deleteMany({
                        where: { ordenId: orden.id }
                    });

                    // Eliminar relaciones orden-servicio
                    await prisma.ordenServicio.deleteMany({
                        where: { ordenId: orden.id }
                    });
                }

                // Eliminar órdenes
                await prisma.orden.deleteMany({
                    where: { clienteId: cliente.id }
                });

                // Eliminar cliente
                await prisma.cliente.delete({
                    where: { id: cliente.id }
                });
            }

            // 3. Verificar si es trabajador y eliminar
            const trabajador = await prisma.trabajador.findUnique({
                where: { usuarioId: parseInt(id) }
            });

            if (trabajador) {
                await prisma.trabajador.delete({
                    where: { id: trabajador.id }
                });
            }

            // 4. Finalmente eliminar el usuario
            await prisma.usuario.delete({
                where: { id: parseInt(id) }
            });

            res.json({ message: 'Usuario eliminado permanentemente' });
        } catch (error) {
            console.error('Error en cascada:', error);
            res.status(500).json({ 
                message: 'Error al eliminar registros asociados al usuario',
                details: error.message
            });
        }
    } catch (error) {
        console.error('Error al eliminar usuario permanentemente:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ 
            message: 'Error al eliminar usuario permanentemente',
            details: error.message
        });
    }
});

// Ruta para reactivar usuario
app.patch('/api/usuarios/:id/reactivar', async (req, res) => {
    try {
        // Verificar que sea administrador
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const { id } = req.params;

        // Reactivar el usuario
        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { activo: true }
        });

        res.json({ message: 'Usuario reactivado correctamente' });
    } catch (error) {
        console.error('Error al reactivar usuario:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error al reactivar usuario' });
    }
});

// Ruta para cancelar una orden (solo si está en estado PENDIENTE)
app.put('/api/ordenes/:id/cancelar', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ordenId = parseInt(id);
    
    // Verificar que la orden exista
    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: { cliente: true }
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Verificar que la orden esté en estado PENDIENTE
    if (orden.estado !== 'PENDIENTE') {
      return res.status(400).json({ 
        error: 'Solo se pueden cancelar órdenes en estado PENDIENTE',
        estadoActual: orden.estado
      });
    }

    // Verificar que el usuario sea el cliente o un administrador
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.tipo !== 'ADMIN') {
      const cliente = await prisma.cliente.findUnique({
        where: { usuarioId: decoded.id }
      });
      
      if (!cliente || cliente.id !== orden.clienteId) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta orden' });
      }
    }

    // Actualizar el estado de la orden a CANCELADA
    const ordenActualizada = await prisma.orden.update({
      where: { id: ordenId },
      data: { estado: 'CANCELADA' },
      include: { cliente: true, servicios: { include: { servicio: true } } }
    });

    // Crear notificación de cancelación
    await prisma.notificacion.create({
      data: {
        usuarioId: orden.cliente.usuarioId,
        mensaje: `La orden #${orden.id} ha sido cancelada`,
        tipo: 'ORDEN',
        enlaceId: ordenId,
        enlaceTipo: 'ORDEN'
      }
    });

    res.json(ordenActualizada);
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    res.status(500).json({ error: 'Error al cancelar la orden' });
  }
});

// Ruta para actualizar el estado de una orden
app.put('/api/ordenes/:id/estado', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const ordenId = parseInt(id);
    
    if (!estado) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }
    
    // Validar que el estado sea válido
    const estadosValidos = ['PENDIENTE', 'PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido', 
        estadosPermitidos: estadosValidos 
      });
    }
    
    // Obtener la orden actual para verificar permisos y estado actual
    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: { cliente: true }
    });
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Validar el flujo de estados
    const estadoActual = orden.estado;
    
    // No permitir cambios a órdenes ya canceladas
    if (estadoActual === 'CANCELADA') {
      return res.status(400).json({ 
        error: 'No se puede cambiar el estado de una orden cancelada' 
      });
    }
    
    // Decodificar el token para obtener la información del usuario
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Solo administradores pueden cambiar el estado (excepto cancelar)
    if (estado !== 'CANCELADA' && decoded.tipo !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Solo los administradores pueden cambiar el estado de las órdenes' 
      });
    }
    
    // Clientes solo pueden cancelar sus propias órdenes en estado PENDIENTE
    if (estado === 'CANCELADA' && decoded.tipo === 'CLIENTE') {
      const cliente = await prisma.cliente.findUnique({
        where: { usuarioId: decoded.id }
      });
      
      if (!cliente || cliente.id !== orden.clienteId) {
        return res.status(403).json({ 
          error: 'No tienes permiso para cancelar esta orden' 
        });
      }
      
      if (estadoActual !== 'PENDIENTE') {
        return res.status(400).json({ 
          error: 'Solo se pueden cancelar órdenes en estado PENDIENTE' 
        });
      }
    }
    
    // Validar progresión lógica de estados
    if (decoded.tipo === 'ADMIN') {
      const flujoEstados = {
        'PENDIENTE': ['PROGRAMADA', 'EN_PROCESO', 'CANCELADA'],
        'PROGRAMADA': ['EN_PROCESO', 'CANCELADA'],
        'EN_PROCESO': ['COMPLETADA', 'CANCELADA']
      };
      
      if (flujoEstados[estadoActual] && !flujoEstados[estadoActual].includes(estado)) {
        return res.status(400).json({ 
          error: `Desde ${estadoActual} solo puede cambiar a: ${flujoEstados[estadoActual].join(', ')}` 
        });
      }
    }
    
    // Actualizar el estado de la orden
    const ordenActualizada = await prisma.orden.update({
      where: { id: ordenId },
      data: { estado },
      include: { 
        cliente: true, 
        servicios: { include: { servicio: true } } 
      }
    });
    
    // Crear una notificación sobre el cambio de estado
    await prisma.notificacion.create({
      data: {
        usuarioId: orden.cliente.usuarioId,
        mensaje: `El estado de la orden #${orden.id} ha cambiado a ${estado}`,
        tipo: 'ORDEN',
        enlaceId: ordenId,
        enlaceTipo: 'ORDEN',
        leida: false
      }
    });
    
    res.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la orden' });
  }
});

// Ruta para eliminar una orden
app.delete('/api/ordenes/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.user;

        // Verificar si el usuario es administrador
        if (usuario.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permisos para eliminar órdenes' });
        }

        // Buscar la orden
        const orden = await prisma.orden.findUnique({
            where: { id: parseInt(id) }
        });

        if (!orden) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        // Eliminar en una transacción para asegurar consistencia
        await prisma.$transaction(async (tx) => {
            // 1. Eliminar facturas relacionadas
            await tx.factura.deleteMany({
                where: { ordenId: parseInt(id) }
            });

            // 2. Eliminar servicios relacionados
            await tx.ordenServicio.deleteMany({
                where: { ordenId: parseInt(id) }
            });

            // 3. Finalmente eliminar la orden
            await tx.orden.delete({
                where: { id: parseInt(id) }
            });
        });

        res.json({ message: 'Orden eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar la orden:', error);
        res.status(500).json({ message: 'Error al eliminar la orden' });
    }
});

// Manejo de errores 404
app.use((req, res) => {
    console.log('Ruta no encontrada:', req.url);
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 