const { validationResult } = require('express-validator');

// Obtener todos los registros de cru00e9ditos
const getAllCredits = async (req, res) => {
  try {
    const prisma = req.prisma;
    const creditos = await prisma.credito.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    res.status(200).json(creditos);
  } catch (error) {
    console.error('Error al obtener cru00e9ditos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener los registros de cru00e9ditos'
    });
  }
};

// Obtener cru00e9ditos por usuario
const getCreditsByUser = async (req, res) => {
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
        message: `No se encontru00f3 un usuario con el ID ${usuarioId}`
      });
    }

    // Obtener todos los cru00e9ditos del usuario
    const creditos = await prisma.credito.findMany({
      where: { usuarioId: Number(usuarioId) },
      orderBy: { fecha: 'desc' }
    });

    // Calcular el balance actual de cru00e9ditos
    const creditosAsignados = creditos
      .filter(c => c.tipo === 'asignacion')
      .reduce((total, c) => total + c.cantidad, 0);
    
    const creditosConsumidos = creditos
      .filter(c => c.tipo === 'consumo')
      .reduce((total, c) => total + c.cantidad, 0);
    
    const balanceActual = creditosAsignados - creditosConsumidos;

    res.status(200).json({
      creditos,
      resumen: {
        creditosAsignados,
        creditosConsumidos,
        balanceActual
      }
    });
  } catch (error) {
    console.error(`Error al obtener cru00e9ditos del usuario ${usuarioId}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener los cru00e9ditos del usuario'
    });
  }
};

// Obtener estadu00edsticas de cru00e9ditos
const getCreditStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Total de cru00e9ditos asignados
    const creditosAsignados = await prisma.credito.aggregate({
      where: { tipo: 'asignacion' },
      _sum: { cantidad: true }
    });

    // Total de cru00e9ditos consumidos
    const creditosConsumidos = await prisma.credito.aggregate({
      where: { tipo: 'consumo' },
      _sum: { cantidad: true }
    });

    // Cru00e9ditos por tipo de consumo
    const consumoPorTipo = await prisma.credito.groupBy({
      by: ['descripcion'],
      where: { tipo: 'consumo' },
      _sum: { cantidad: true },
      _count: { _all: true }
    });

    // Tendencia mensual de consumo
    const mesesRecientes = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7); // Formato YYYY-MM
    }).reverse();

    // Consultar datos para cada mes
    const tendenciaMensual = await Promise.all(mesesRecientes.map(async (mes) => {
      const inicio = new Date(`${mes}-01T00:00:00Z`);
      const siguienteMes = new Date(inicio);
      siguienteMes.setMonth(siguienteMes.getMonth() + 1);
      
      const asignados = await prisma.credito.aggregate({
        where: { 
          tipo: 'asignacion',
          fecha: {
            gte: inicio,
            lt: siguienteMes
          }
        },
        _sum: { cantidad: true }
      });
      
      const consumidos = await prisma.credito.aggregate({
        where: { 
          tipo: 'consumo',
          fecha: {
            gte: inicio,
            lt: siguienteMes
          }
        },
        _sum: { cantidad: true }
      });
      
      return {
        mes: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
        asignados: asignados._sum.cantidad || 0,
        consumidos: consumidos._sum.cantidad || 0
      };
    }));

    // Usuarios con mu00e1s consumo
    const usuariosTopConsumo = await prisma.credito.groupBy({
      by: ['usuarioId'],
      where: { tipo: 'consumo' },
      _sum: { cantidad: true },
      orderBy: {
        _sum: {
          cantidad: 'desc'
        }
      },
      take: 5
    });

    // Obtener nombres de usuarios
    const usuariosIds = usuariosTopConsumo.map(u => u.usuarioId);
    const usuariosInfo = await prisma.usuario.findMany({
      where: {
        id: { in: usuariosIds }
      },
      select: {
        id: true,
        nombre: true
      }
    });

    const usuariosTopConsumoConNombres = usuariosTopConsumo.map(u => ({
      usuarioId: u.usuarioId,
      nombre: usuariosInfo.find(info => info.id === u.usuarioId)?.nombre || 'Usuario desconocido',
      totalConsumido: u._sum.cantidad
    }));

    res.status(200).json({
      resumen: {
        totalAsignados: creditosAsignados._sum.cantidad || 0,
        totalConsumidos: creditosConsumidos._sum.cantidad || 0,
        balanceGlobal: (creditosAsignados._sum.cantidad || 0) - (creditosConsumidos._sum.cantidad || 0)
      },
      consumoPorTipo,
      tendenciaMensual,
      usuariosTopConsumo: usuariosTopConsumoConNombres
    });
  } catch (error) {
    console.error('Error al obtener estadu00edsticas de cru00e9ditos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener las estadu00edsticas de cru00e9ditos'
    });
  }
};

// Asignar cru00e9ditos a un usuario
const assignCredits = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { usuarioId, cantidad, motivo } = req.body;

  try {
    const prisma = req.prisma;
    
    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontru00f3 un usuario con el ID ${usuarioId}`
      });
    }

    // Registrar la asignaciu00f3n de cru00e9ditos
    const creditoAsignado = await prisma.credito.create({
      data: {
        usuarioId: Number(usuarioId),
        cantidad: Number(cantidad),
        tipo: 'asignacion',
        descripcion: motivo,
        fecha: new Date()
      }
    });

    res.status(201).json({
      message: 'Cru00e9ditos asignados correctamente',
      credito: creditoAsignado
    });
  } catch (error) {
    console.error('Error al asignar cru00e9ditos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al asignar cru00e9ditos al usuario'
    });
  }
};

// Registrar consumo de cru00e9ditos
const recordCreditUsage = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { usuarioId, cantidad, descripcion, tipo } = req.body;

  try {
    const prisma = req.prisma;
    
    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontru00f3 un usuario con el ID ${usuarioId}`
      });
    }

    // Verificar si el usuario tiene suficientes cru00e9ditos
    const creditos = await prisma.credito.findMany({
      where: { usuarioId: Number(usuarioId) }
    });

    const creditosAsignados = creditos
      .filter(c => c.tipo === 'asignacion')
      .reduce((total, c) => total + c.cantidad, 0);
    
    const creditosConsumidos = creditos
      .filter(c => c.tipo === 'consumo')
      .reduce((total, c) => total + c.cantidad, 0);
    
    const balanceActual = creditosAsignados - creditosConsumidos;

    if (balanceActual < cantidad) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        message: `El usuario no tiene suficientes cru00e9ditos. Balance actual: ${balanceActual}, Solicitado: ${cantidad}`
      });
    }

    // Registrar el consumo de cru00e9ditos
    const creditoConsumido = await prisma.credito.create({
      data: {
        usuarioId: Number(usuarioId),
        cantidad: Number(cantidad),
        tipo: 'consumo',
        descripcion: `${tipo}: ${descripcion}`,
        fecha: new Date()
      }
    });

    res.status(201).json({
      message: 'Consumo de cru00e9ditos registrado correctamente',
      credito: creditoConsumido,
      balanceActualizado: balanceActual - cantidad
    });
  } catch (error) {
    console.error('Error al registrar consumo de cru00e9ditos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al registrar el consumo de cru00e9ditos'
    });
  }
};

// Obtener historial de transacciones de cru00e9ditos
const getCreditHistory = async (req, res) => {
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
        message: `No se encontru00f3 un usuario con el ID ${usuarioId}`
      });
    }

    // Obtener el historial de transacciones
    const historial = await prisma.credito.findMany({
      where: { usuarioId: Number(usuarioId) },
      orderBy: { fecha: 'desc' }
    });

    // Calcular saldo acumulado
    let saldoAcumulado = 0;
    const historialConSaldo = historial.map(h => {
      if (h.tipo === 'asignacion') {
        saldoAcumulado += h.cantidad;
      } else if (h.tipo === 'consumo') {
        saldoAcumulado -= h.cantidad;
      }
      return {
        ...h,
        saldoAcumulado
      };
    }).reverse();

    res.status(200).json(historialConSaldo);
  } catch (error) {
    console.error(`Error al obtener historial de cru00e9ditos para usuario ${usuarioId}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener el historial de transacciones de cru00e9ditos'
    });
  }
};

// Obtener informe de consumo por tipo
const getCreditUsageByType = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Consumo por tipo
    const consumoPorTipo = await prisma.credito.groupBy({
      by: ['descripcion'],
      where: { tipo: 'consumo' },
      _sum: { cantidad: true },
      _count: { _all: true }
    });

    res.status(200).json(consumoPorTipo);
  } catch (error) {
    console.error('Error al obtener informe de consumo por tipo:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener el informe de consumo por tipo'
    });
  }
};

// Obtener informe de consumo diario/mensual
const getCreditUsageByPeriod = async (req, res) => {
  const { periodo = 'mensual', meses = 6 } = req.query;

  try {
    const prisma = req.prisma;
    
    if (periodo === 'mensual') {
      // Consumo mensual
      const mesesRecientes = Array.from({ length: Number(meses) }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().substring(0, 7); // Formato YYYY-MM
      }).reverse();

      // Consultar datos para cada mes
      const consumoMensual = await Promise.all(mesesRecientes.map(async (mes) => {
        const inicio = new Date(`${mes}-01T00:00:00Z`);
        const siguienteMes = new Date(inicio);
        siguienteMes.setMonth(siguienteMes.getMonth() + 1);
        
        const consumo = await prisma.credito.aggregate({
          where: { 
            tipo: 'consumo',
            fecha: {
              gte: inicio,
              lt: siguienteMes
            }
          },
          _sum: { cantidad: true }
        });
        
        return {
          periodo: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
          consumo: consumo._sum.cantidad || 0
        };
      }));

      res.status(200).json(consumoMensual);
    } else if (periodo === 'diario') {
      // Consumo diario (u00faltimos 30 du00edas)
      const dias = 30;
      const diasRecientes = Array.from({ length: dias }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().substring(0, 10); // Formato YYYY-MM-DD
      }).reverse();

      // Consultar datos para cada du00eda
      const consumoDiario = await Promise.all(diasRecientes.map(async (dia) => {
        const inicio = new Date(`${dia}T00:00:00Z`);
        const fin = new Date(`${dia}T23:59:59.999Z`);
        
        const consumo = await prisma.credito.aggregate({
          where: { 
            tipo: 'consumo',
            fecha: {
              gte: inicio,
              lte: fin
            }
          },
          _sum: { cantidad: true }
        });
        
        return {
          periodo: inicio.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          consumo: consumo._sum.cantidad || 0
        };
      }));

      res.status(200).json(consumoDiario);
    } else {
      return res.status(400).json({
        error: 'Paru00e1metro invu00e1lido',
        message: 'El paru00e1metro "periodo" debe ser "mensual" o "diario"'
      });
    }
  } catch (error) {
    console.error('Error al obtener informe de consumo por periodo:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurriu00f3 un error al obtener el informe de consumo por periodo'
    });
  }
};

module.exports = {
  getAllCredits,
  getCreditsByUser,
  getCreditStats,
  assignCredits,
  recordCreditUsage,
  getCreditHistory,
  getCreditUsageByType,
  getCreditUsageByPeriod
};
