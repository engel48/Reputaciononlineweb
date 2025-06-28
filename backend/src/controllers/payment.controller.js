const { validationResult } = require('express-validator');

// Obtener todos los pagos
const getAllPayments = async (req, res) => {
  try {
    const prisma = req.prisma;
    const pagos = await prisma.pago.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    res.status(200).json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener la lista de pagos'
    });
  }
};

// Obtener un pago por ID
const getPaymentById = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;
    const pago = await prisma.pago.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        plan: true
      }
    });

    if (!pago) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        message: `No se encontró un pago con el ID ${id}`
      });
    }

    res.status(200).json(pago);
  } catch (error) {
    console.error(`Error al obtener pago con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener la información del pago'
    });
  }
};

// Crear un nuevo registro de pago
const createPayment = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { usuarioId, planId, monto, metodoPago, estado, referenciaPago, descripcion } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${usuarioId}`
      });
    }

    // Verificar si el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: Number(planId) }
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Plan no encontrado',
        message: `No se encontró un plan con el ID ${planId}`
      });
    }

    // Crear el registro de pago
    const nuevoPago = await prisma.pago.create({
      data: {
        usuarioId: Number(usuarioId),
        planId: Number(planId),
        monto: parseFloat(monto),
        metodoPago,
        estado,
        referenciaPago,
        descripcion: descripcion || `Pago por plan: ${plan.nombre}`,
        fecha: new Date()
      }
    });

    // Si el pago está completado, asignar créditos al usuario
    if (estado === 'completado') {
      // Actualizar el plan del usuario
      await prisma.usuario.update({
        where: { id: Number(usuarioId) },
        data: {
          planId: Number(planId),
          fechaActualizacion: new Date()
        }
      });

      // Asignar créditos
      await prisma.credito.create({
        data: {
          usuarioId: Number(usuarioId),
          cantidad: plan.creditos,
          tipo: 'asignacion',
          descripcion: `Asignación de créditos por pago de plan: ${plan.nombre}`,
          fecha: new Date()
        }
      });
    }

    res.status(201).json(nuevoPago);
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al crear el nuevo registro de pago'
    });
  }
};

// Actualizar un pago
const updatePayment = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { estado, referenciaPago, descripcion } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si el pago existe
    const existingPago = await prisma.pago.findUnique({
      where: { id: Number(id) },
      include: {
        plan: true
      }
    });

    if (!existingPago) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        message: `No se encontró un pago con el ID ${id}`
      });
    }

    // Verificar si se está cambiando el estado a 'completado'
    const cambioACompletado = existingPago.estado !== 'completado' && estado === 'completado';

    // Preparar los datos para actualizar
    const updateData = {};
    if (estado) updateData.estado = estado;
    if (referenciaPago) updateData.referenciaPago = referenciaPago;
    if (descripcion) updateData.descripcion = descripcion;

    // Actualizar el pago
    const pagoActualizado = await prisma.pago.update({
      where: { id: Number(id) },
      data: updateData
    });

    // Si el pago cambió a completado, asignar créditos al usuario
    if (cambioACompletado) {
      // Actualizar el plan del usuario
      await prisma.usuario.update({
        where: { id: existingPago.usuarioId },
        data: {
          planId: existingPago.planId,
          fechaActualizacion: new Date()
        }
      });

      // Asignar créditos
      await prisma.credito.create({
        data: {
          usuarioId: existingPago.usuarioId,
          cantidad: existingPago.plan.creditos,
          tipo: 'asignacion',
          descripcion: `Asignación de créditos por confirmación de pago: ${existingPago.plan.nombre}`,
          fecha: new Date()
        }
      });
    }

    res.status(200).json(pagoActualizado);
  } catch (error) {
    console.error(`Error al actualizar pago con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al actualizar la información del pago'
    });
  }
};

// Generar factura
const generateInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;

    // Obtener información del pago
    const pago = await prisma.pago.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        plan: true
      }
    });

    if (!pago) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        message: `No se encontró un pago con el ID ${id}`
      });
    }

    // En una implementación real, aquí se generaría un PDF o HTML con la factura
    // Por ahora, solo devolvemos los datos estructurados

    const factura = {
      numeroFactura: `F-${pago.id}-${Date.now().toString().substring(6)}`,
      fecha: pago.fecha,
      estado: pago.estado,
      cliente: {
        nombre: pago.usuario.nombre,
        email: pago.usuario.email,
        id: pago.usuario.id
      },
      concepto: pago.descripcion || `Plan ${pago.plan.nombre}`,
      detalles: [
        {
          descripcion: `Plan ${pago.plan.nombre}`,
          cantidad: 1,
          precioUnitario: pago.monto,
          subtotal: pago.monto
        }
      ],
      subtotal: pago.monto,
      impuestos: 0, // En una implementación real, esto se calcularía
      total: pago.monto,
      metodoPago: pago.metodoPago,
      referenciaPago: pago.referenciaPago,
      notasAdicionales: `Este documento sirve como comprobante de pago para el servicio de Reputación Online. Incluye ${pago.plan.creditos} créditos por un período de ${pago.plan.duracion} días.`
    };

    res.status(200).json(factura);
  } catch (error) {
    console.error(`Error al generar factura para el pago con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al generar la factura'
    });
  }
};

// Obtener estadísticas de pagos
const getPaymentStats = async (req, res) => {
  try {
    const prisma = req.prisma;

    // Total de ingresos
    const ingresos = await prisma.pago.aggregate({
      where: { estado: 'completado' },
      _sum: { monto: true }
    });

    // Pagos por estado
    const pagosPorEstado = await prisma.pago.groupBy({
      by: ['estado'],
      _count: { _all: true },
      _sum: { monto: true }
    });

    // Pagos por método de pago
    const pagosPorMetodo = await prisma.pago.groupBy({
      by: ['metodoPago'],
      _count: { _all: true },
      _sum: { monto: true }
    });

    // Ingresos por mes (últimos 6 meses)
    const mesesRecientes = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7); // Formato YYYY-MM
    }).reverse();

    // Consultar datos para cada mes
    const ingresosPorMes = await Promise.all(mesesRecientes.map(async (mes) => {
      const inicio = new Date(`${mes}-01T00:00:00Z`);
      const siguienteMes = new Date(inicio);
      siguienteMes.setMonth(siguienteMes.getMonth() + 1);
      
      const pagos = await prisma.pago.aggregate({
        where: { 
          estado: 'completado',
          fecha: {
            gte: inicio,
            lt: siguienteMes
          }
        },
        _sum: { monto: true },
        _count: { _all: true }
      });
      
      return {
        mes: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
        ingresos: pagos._sum.monto || 0,
        cantidad: pagos._count._all
      };
    }));

    res.status(200).json({
      total: {
        ingresos: ingresos._sum.monto || 0
      },
      porEstado: pagosPorEstado,
      porMetodoPago: pagosPorMetodo,
      tendenciaMensual: ingresosPorMes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de pagos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas de pagos'
    });
  }
};

// Obtener pagos por usuario
const getPaymentsByUser = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const prisma = req.prisma;
    
    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${usuarioId}`
      });
    }

    // Obtener pagos del usuario
    const pagos = await prisma.pago.findMany({
      where: { usuarioId: Number(usuarioId) },
      include: {
        plan: {
          select: {
            nombre: true,
            creditos: true,
            duracion: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    // Calcular total de pagos completados
    const totalPagado = pagos
      .filter(p => p.estado === 'completado')
      .reduce((total, p) => total + p.monto, 0);

    res.status(200).json({
      pagos,
      resumen: {
        total: pagos.length,
        completados: pagos.filter(p => p.estado === 'completado').length,
        pendientes: pagos.filter(p => p.estado === 'pendiente').length,
        rechazados: pagos.filter(p => p.estado === 'rechazado').length,
        totalPagado
      }
    });
  } catch (error) {
    console.error(`Error al obtener pagos del usuario ${usuarioId}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener los pagos del usuario'
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  generateInvoice,
  getPaymentStats,
  getPaymentsByUser
};
