const { validationResult } = require('express-validator');

// Obtener todos los planes
const getAllPlans = async (req, res) => {
  try {
    const prisma = req.prisma;
    const planes = await prisma.plan.findMany({
      orderBy: {
        precio: 'asc'
      }
    });

    res.status(200).json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener la lista de planes'
    });
  }
};

// Obtener un plan por ID
const getPlanById = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;
    const plan = await prisma.plan.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { usuarios: true }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Plan no encontrado',
        message: `No se encontru00f3 un plan con el ID ${id}`
      });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error(`Error al obtener plan con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener la informaciu00f3n del plan'
    });
  }
};

// Crear un nuevo plan
const createPlan = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, descripcion, precio, creditos, duracion } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si ya existe un plan con el mismo nombre
    const existingPlan = await prisma.plan.findFirst({
      where: { nombre }
    });

    if (existingPlan) {
      return res.status(400).json({
        error: 'Nombre de plan duplicado',
        message: 'Ya existe un plan con ese nombre'
      });
    }

    // Crear el plan
    const nuevoPlan = await prisma.plan.create({
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        creditos: parseInt(creditos),
        duracion: parseInt(duracion),
        activo: true
      }
    });

    res.status(201).json(nuevoPlan);
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al crear el nuevo plan'
    });
  }
};

// Actualizar un plan
const updatePlan = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { nombre, descripcion, precio, creditos, duracion, activo } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si el plan existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: Number(id) }
    });

    if (!existingPlan) {
      return res.status(404).json({
        error: 'Plan no encontrado',
        message: `No se encontru00f3 un plan con el ID ${id}`
      });
    }

    // Si se va a cambiar el nombre, verificar que no exista otro plan con ese nombre
    if (nombre && nombre !== existingPlan.nombre) {
      const planConMismoNombre = await prisma.plan.findFirst({
        where: {
          nombre,
          id: { not: Number(id) }
        }
      });

      if (planConMismoNombre) {
        return res.status(400).json({
          error: 'Nombre de plan duplicado',
          message: 'Ya existe otro plan con ese nombre'
        });
      }
    }

    // Preparar los datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (descripcion) updateData.descripcion = descripcion;
    if (precio !== undefined) updateData.precio = parseFloat(precio);
    if (creditos !== undefined) updateData.creditos = parseInt(creditos);
    if (duracion !== undefined) updateData.duracion = parseInt(duracion);
    if (activo !== undefined) updateData.activo = activo;

    // Actualizar el plan
    const planActualizado = await prisma.plan.update({
      where: { id: Number(id) },
      data: updateData
    });

    res.status(200).json(planActualizado);
  } catch (error) {
    console.error(`Error al actualizar plan con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al actualizar la informaciu00f3n del plan'
    });
  }
};

// Eliminar un plan
const deletePlan = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;

    // Verificar si el plan existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { usuarios: true }
        }
      }
    });

    if (!existingPlan) {
      return res.status(404).json({
        error: 'Plan no encontrado',
        message: `No se encontru00f3 un plan con el ID ${id}`
      });
    }

    // Verificar si hay usuarios que utilizan este plan
    if (existingPlan._count.usuarios > 0) {
      return res.status(400).json({
        error: 'Plan en uso',
        message: `No se puede eliminar el plan porque estu00e1 asignado a ${existingPlan._count.usuarios} usuario(s)`
      });
    }

    // Eliminar el plan
    await prisma.plan.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({
      message: 'Plan eliminado correctamente'
    });
  } catch (error) {
    console.error(`Error al eliminar plan con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al eliminar el plan'
    });
  }
};

// Obtener estadu00edsticas de planes
const getPlanStats = async (req, res) => {
  try {
    const prisma = req.prisma;

    // Total de planes activos/inactivos
    const planesActivos = await prisma.plan.count({
      where: { activo: true }
    });

    const planesInactivos = await prisma.plan.count({
      where: { activo: false }
    });

    // Usuarios por plan
    const usuariosPorPlan = await prisma.usuario.groupBy({
      by: ['planId'],
      _count: { _all: true }
    });

    // Obtener información de los planes
    const planesInfo = await prisma.plan.findMany({
      select: {
        id: true,
        nombre: true,
        precio: true,
        creditos: true
      }
    });

    // Combinar datos
    const planesDatos = planesInfo.map(plan => ({
      id: plan.id,
      nombre: plan.nombre,
      precio: plan.precio,
      creditos: plan.creditos,
      usuarios: usuariosPorPlan.find(u => u.planId === plan.id)?._count._all || 0
    }));

    // Ingresos generados por plan
    const ingresosPorPlan = await prisma.pago.groupBy({
      by: ['planId'],
      where: { estado: 'completado' },
      _sum: { monto: true },
      _count: { _all: true }
    });

    // Combinar datos de ingresos
    const planesConIngresos = planesDatos.map(plan => ({
      ...plan,
      ingresos: ingresosPorPlan.find(i => i.planId === plan.id)?._sum.monto || 0,
      ventas: ingresosPorPlan.find(i => i.planId === plan.id)?._count._all || 0
    }));

    res.status(200).json({
      resumen: {
        total: planesActivos + planesInactivos,
        activos: planesActivos,
        inactivos: planesInactivos
      },
      planes: planesConIngresos
    });
  } catch (error) {
    console.error('Error al obtener estadu00edsticas de planes:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener las estadu00edsticas de planes'
    });
  }
};

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanStats
};
