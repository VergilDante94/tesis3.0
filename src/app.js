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

// Middleware
app.use(express.json());
app.use(express.static('public'));

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

// Rutas de órdenes
app.post('/api/ordenes', verificarToken, async (req, res) => {
  try {
    const { clienteId, servicios } = req.body;
    console.log('Creando orden:', { clienteId, servicios });

    // Buscar el cliente directamente por su ID
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const orden = await prisma.orden.create({
      data: {
        clienteId: cliente.id,
        estado: 'PENDIENTE',
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
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioId = decoded.id;
    const tipo = decoded.tipo;

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
      ordenDireccion = 'desc'
    } = req.query;

    // Construir condiciones de filtrado
    let whereCondition = {};
    
    // Filtro por estado
    if (estado) {
      whereCondition.estado = estado;
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
        })
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
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioId = decoded.id;
    const tipo = decoded.tipo;
    
    const { id } = req.params;
    const ordenId = parseInt(id);

    // Buscar la orden
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
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Verificar permisos: solo el cliente propietario, el admin o un trabajador pueden ver la orden
    if (tipo === 'CLIENTE') {
      // Buscar el cliente asociado al usuario
      const cliente = await prisma.cliente.findUnique({
        where: { usuarioId: parseInt(usuarioId) }
      });

      if (!cliente || cliente.id !== orden.clienteId) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
      }
    }
    
    // Calcular precios
    const subtotal = orden.servicios.reduce((sum, item) => 
      sum + (item.cantidad * item.precioUnitario), 0);
    
    // Ya no calculamos impuestos
    
    // Calcular total (ahora igual al subtotal)
    const total = subtotal;
    
    // Añadir información de precios y formatear fecha
    const ordenDetallada = {
      ...orden,
      precios: {
        subtotal: subtotal,
        total: total
      },
      fechaFormateada: new Date(orden.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      // Detallar servicios de manera más clara
      detallesServicios: orden.servicios.map(item => ({
        id: item.servicio.id,
        nombre: item.servicio.nombre,
        descripcion: item.servicio.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario
      }))
    };
    
    res.json(ordenDetallada);
  } catch (error) {
    console.error('Error al obtener orden por ID:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    res.status(500).json({ error: 'Error al obtener orden' });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 