const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const servicioController = {
    // Crear nuevo servicio
    async crear(req, res) {
        try {
            const { nombre, descripcion, precioBase, tipo } = req.body;
            const servicio = await prisma.servicio.create({
                data: {
                    nombre,
                    descripcion,
                    precioBase: parseFloat(precioBase),
                    tipo,
                    estado: 'ACTIVO'
                }
            });
            res.status(201).json(servicio);
        } catch (error) {
            console.error('Error al crear servicio:', error);
            res.status(500).json({ error: 'Error al crear servicio' });
        }
    },

    // Obtener todos los servicios
    async listar(req, res) {
        try {
            const servicios = await prisma.servicio.findMany({
                where: {
                    estado: 'ACTIVO'
                },
                orderBy: {
                    nombre: 'asc'
                }
            });
            res.json(servicios);
        } catch (error) {
            console.error('Error al listar servicios:', error);
            res.status(500).json({ error: 'Error al listar servicios' });
        }
    },

    // Obtener servicio por ID
    async obtener(req, res) {
        try {
            const { id } = req.params;
            const servicio = await prisma.servicio.findUnique({
                where: { id: parseInt(id) }
            });
            if (!servicio) {
                return res.status(404).json({ error: 'Servicio no encontrado' });
            }
            res.json(servicio);
        } catch (error) {
            console.error('Error al obtener servicio:', error);
            res.status(500).json({ error: 'Error al obtener servicio' });
        }
    },

    // Actualizar servicio
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, precioBase, tipo } = req.body;
            const servicio = await prisma.servicio.update({
                where: { id: parseInt(id) },
                data: {
                    nombre,
                    descripcion,
                    precioBase: parseFloat(precioBase),
                    tipo
                }
            });
            res.json(servicio);
        } catch (error) {
            console.error('Error al actualizar servicio:', error);
            res.status(500).json({ error: 'Error al actualizar servicio' });
        }
    },
    
    // Eliminar servicio
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            console.log(`Solicitud de eliminación recibida para servicio ID: ${id}`);
            
            // Verificar si el servicio existe
            const servicio = await prisma.servicio.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!servicio) {
                console.log(`Servicio con ID ${id} no encontrado`);
                return res.status(404).json({ error: 'Servicio no encontrado' });
            }
            console.log(`Servicio encontrado: ${JSON.stringify(servicio)}`);
            
            // Verificar si el servicio está siendo utilizado en alguna orden
            const ordenesConServicio = await prisma.ordenServicio.findMany({
                where: {
                    servicioId: parseInt(id)
                }
            });
            console.log(`Órdenes que utilizan el servicio: ${ordenesConServicio.length}`);
            
            // Si el servicio está en uso, marcarlo como inactivo en lugar de eliminarlo
            if (ordenesConServicio.length > 0) {
                console.log(`Servicio ${id} está en uso en ${ordenesConServicio.length} órdenes. Marcando como INACTIVO.`);
                const servicioActualizado = await prisma.servicio.update({
                    where: { id: parseInt(id) },
                    data: { estado: 'INACTIVO' }
                });
                
                console.log(`Servicio marcado como INACTIVO: ${JSON.stringify(servicioActualizado)}`);
                return res.json({
                    message: 'Servicio marcado como inactivo ya que está siendo utilizado en órdenes.',
                    estado: 'INACTIVO',
                    servicio: servicioActualizado
                });
            }
            
            // Si no está en uso, eliminarlo completamente
            console.log(`Eliminando completamente el servicio con ID ${id}...`);
            await prisma.servicio.delete({
                where: { id: parseInt(id) }
            });
            
            console.log(`Servicio eliminado con éxito: ${id}`);
            res.json({ message: 'Servicio eliminado con éxito' });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            res.status(500).json({ error: 'Error al eliminar servicio' });
        }
    },

    // Método para depuración
    async debug(req, res) {
        try {
            console.log('Solicitud de depuración recibida');
            console.log('Usuario en la solicitud:', req.usuario);
            
            // Verificar token
            if (!req.usuario) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            
            // Verificar si es admin
            if (req.usuario.tipo !== 'ADMIN') {
                return res.status(403).json({ 
                    error: 'No tiene permisos de administrador',
                    usuario: {
                        id: req.usuario.id,
                        tipo: req.usuario.tipo
                    }
                });
            }
            
            // Si todo está bien, devolver información sobre las rutas
            const totalServicios = await prisma.servicio.count();
            
            return res.json({
                message: 'API de servicios funcionando correctamente',
                debug: {
                    usuario: req.usuario,
                    rutas_disponibles: [
                        { método: 'GET', ruta: '/api/servicios', descripción: 'Listar servicios' },
                        { método: 'GET', ruta: '/api/servicios/:id', descripción: 'Obtener servicio por ID' },
                        { método: 'POST', ruta: '/api/servicios', descripción: 'Crear servicio' },
                        { método: 'PUT', ruta: '/api/servicios/:id', descripción: 'Actualizar servicio' },
                        { método: 'DELETE', ruta: '/api/servicios/:id', descripción: 'Eliminar servicio' }
                    ],
                    servicios_en_bd: totalServicios
                }
            });
        } catch (error) {
            console.error('Error en ruta de depuración:', error);
            res.status(500).json({ error: 'Error en ruta de depuración' });
        }
    }
};

module.exports = servicioController;
