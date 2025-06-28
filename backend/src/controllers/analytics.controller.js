// Controlador para estadísticas y análisis del panel administrativo

// Obtener estadísticas generales del dashboard
const getDashboardStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Estadísticas de usuarios
    const totalUsuarios = await prisma.usuario.count();
    const usuariosActivos = await prisma.usuario.count({
      where: { estado: 'activo' }
    });
    
    // Estadísticas de créditos
    const creditosAsignados = await prisma.credito.aggregate({
      where: { tipo: 'asignacion' },
      _sum: { cantidad: true }
    });
    
    const creditosConsumidos = await prisma.credito.aggregate({
      where: { tipo: 'consumo' },
      _sum: { cantidad: true }
    });
    
    // Estadísticas de redes sociales
    const redesConectadas = await prisma.redSocial.count({
      where: { activo: true }
    });
    
    // Estadísticas de pagos
    const ingresoTotal = await prisma.pago.aggregate({
      where: { estado: 'completado' },
      _sum: { monto: true }
    });
    
    // Obtener datos de actividad reciente
    const pagosRecientes = await prisma.pago.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: { nombre: true }
        },
        plan: {
          select: { nombre: true }
        }
      }
    });
    
    const busquedasRecientes = await prisma.busqueda.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: { nombre: true }
        }
      }
    });
    
    // Calcular tendencias (comparación con mes anterior)
    const hoy = new Date();
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    
    // Usuarios nuevos este mes
    const usuariosNuevosMesActual = await prisma.usuario.count({
      where: {
        fechaCreacion: {
          gte: inicioMesActual
        }
      }
    });
    
    const usuariosNuevosMesAnterior = await prisma.usuario.count({
      where: {
        fechaCreacion: {
          gte: inicioMesAnterior,
          lt: inicioMesActual
        }
      }
    });
    
    const cambioUsuarios = usuariosNuevosMesAnterior === 0 
      ? 100 
      : Math.round((usuariosNuevosMesActual - usuariosNuevosMesAnterior) / usuariosNuevosMesAnterior * 100);
    
    // Consumo de créditos este mes
    const consumoCreditosMesActual = await prisma.credito.aggregate({
      where: {
        tipo: 'consumo',
        fecha: {
          gte: inicioMesActual
        }
      },
      _sum: { cantidad: true }
    });
    
    const consumoCreditosMesAnterior = await prisma.credito.aggregate({
      where: {
        tipo: 'consumo',
        fecha: {
          gte: inicioMesAnterior,
          lt: inicioMesActual
        }
      },
      _sum: { cantidad: true }
    });
    
    const cambioConsumoCreditos = (consumoCreditosMesAnterior._sum.cantidad || 0) === 0 
      ? 100 
      : Math.round(((consumoCreditosMesActual._sum.cantidad || 0) - (consumoCreditosMesAnterior._sum.cantidad || 0)) / (consumoCreditosMesAnterior._sum.cantidad || 1) * 100);
    
    // Armar respuesta
    res.status(200).json({
      estadisticas: {
        usuarios: {
          total: totalUsuarios,
          activos: usuariosActivos,
          cambio: `${cambioUsuarios}%`
        },
        creditos: {
          asignados: creditosAsignados._sum.cantidad || 0,
          consumidos: creditosConsumidos._sum.cantidad || 0,
          disponibles: (creditosAsignados._sum.cantidad || 0) - (creditosConsumidos._sum.cantidad || 0),
          cambioConsumo: `${cambioConsumoCreditos}%`
        },
        redesSociales: {
          conectadas: redesConectadas
        },
        finanzas: {
          ingresoTotal: ingresoTotal._sum.monto || 0
        }
      },
      actividadReciente: {
        pagos: pagosRecientes,
        busquedas: busquedasRecientes
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas del dashboard'
    });
  }
};

// Obtener estadísticas de usuarios
const getUserStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Total de usuarios por rol
    const usuariosPorRol = await prisma.usuario.groupBy({
      by: ['rol'],
      _count: { _all: true }
    });
    
    // Total de usuarios por estado
    const usuariosPorEstado = await prisma.usuario.groupBy({
      by: ['estado'],
      _count: { _all: true }
    });
    
    // Usuarios más activos (basado en búsquedas realizadas)
    const usuariosActivosBusquedas = await prisma.busqueda.groupBy({
      by: ['usuarioId'],
      _count: { _all: true },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 5
    });
    
    // Obtener información de los usuarios más activos
    const idsUsuariosActivos = usuariosActivosBusquedas.map(u => u.usuarioId);
    const infoUsuariosActivos = await prisma.usuario.findMany({
      where: {
        id: { in: idsUsuariosActivos }
      },
      select: {
        id: true,
        nombre: true,
        email: true
      }
    });
    
    // Combinar datos
    const usuariosActivos = usuariosActivosBusquedas.map(u => ({
      id: u.usuarioId,
      nombre: infoUsuariosActivos.find(info => info.id === u.usuarioId)?.nombre || 'Usuario desconocido',
      email: infoUsuariosActivos.find(info => info.id === u.usuarioId)?.email || '',
      busquedas: u._count._all
    }));
    
    // Nuevos usuarios por mes (últimos 6 meses)
    const mesesRecientes = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7); // Formato YYYY-MM
    }).reverse();
    
    // Consultar datos para cada mes
    const usuariosPorMes = await Promise.all(mesesRecientes.map(async (mes) => {
      const inicio = new Date(`${mes}-01T00:00:00Z`);
      const siguienteMes = new Date(inicio);
      siguienteMes.setMonth(siguienteMes.getMonth() + 1);
      
      const count = await prisma.usuario.count({
        where: { 
          fechaCreacion: {
            gte: inicio,
            lt: siguienteMes
          }
        }
      });
      
      return {
        mes: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
        cantidad: count
      };
    }));
    
    res.status(200).json({
      porRol: usuariosPorRol,
      porEstado: usuariosPorEstado,
      masActivos: usuariosActivos,
      crecimientoMensual: usuariosPorMes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas de usuarios'
    });
  }
};

// Obtener estadísticas de consumo de créditos
const getCreditStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Total de créditos asignados y consumidos
    const creditosAsignados = await prisma.credito.aggregate({
      where: { tipo: 'asignacion' },
      _sum: { cantidad: true }
    });
    
    const creditosConsumidos = await prisma.credito.aggregate({
      where: { tipo: 'consumo' },
      _sum: { cantidad: true }
    });
    
    // Consumo por tipo
    const consumoPorTipo = await prisma.credito.groupBy({
      by: ['descripcion'],
      where: { tipo: 'consumo' },
      _sum: { cantidad: true }
    });
    
    // Tendencia mensual (últimos 6 meses)
    const mesesRecientes = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7); // Formato YYYY-MM
    }).reverse();
    
    // Consultar datos para cada mes
    const consumoPorMes = await Promise.all(mesesRecientes.map(async (mes) => {
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
        mes: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
        cantidad: consumo._sum.cantidad || 0
      };
    }));
    
    res.status(200).json({
      total: {
        asignados: creditosAsignados._sum.cantidad || 0,
        consumidos: creditosConsumidos._sum.cantidad || 0,
        disponibles: (creditosAsignados._sum.cantidad || 0) - (creditosConsumidos._sum.cantidad || 0)
      },
      porTipo: consumoPorTipo,
      tendenciaMensual: consumoPorMes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de créditos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas de créditos'
    });
  }
};

// Obtener estadísticas de redes sociales conectadas
const getSocialNetworkStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Total de redes sociales por plataforma
    const redesPorPlataforma = await prisma.redSocial.groupBy({
      by: ['plataforma'],
      _count: { _all: true }
    });
    
    // Usuarios con más redes conectadas
    const usuariosConMasRedes = await prisma.redSocial.groupBy({
      by: ['usuarioId'],
      _count: { _all: true },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 5
    });
    
    // Obtener información de los usuarios
    const idsUsuarios = usuariosConMasRedes.map(u => u.usuarioId);
    const infoUsuarios = await prisma.usuario.findMany({
      where: {
        id: { in: idsUsuarios }
      },
      select: {
        id: true,
        nombre: true
      }
    });
    
    // Combinar datos
    const usuariosRedes = usuariosConMasRedes.map(u => ({
      id: u.usuarioId,
      nombre: infoUsuarios.find(info => info.id === u.usuarioId)?.nombre || 'Usuario desconocido',
      redesConectadas: u._count._all
    }));
    
    res.status(200).json({
      porPlataforma: redesPorPlataforma,
      usuariosConMasRedes: usuariosRedes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de redes sociales:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas de redes sociales'
    });
  }
};

// Obtener estadísticas de búsquedas realizadas
const getSearchStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Total de búsquedas
    const totalBusquedas = await prisma.busqueda.count();
    
    // Búsquedas por tipo de entidad
    const busquedasPorTipo = await prisma.busqueda.groupBy({
      by: ['tipoEntidad'],
      _count: { _all: true }
    });
    
    // Búsquedas por ubicación
    const busquedasPorUbicacion = await prisma.busqueda.groupBy({
      by: ['ubicacion'],
      _count: { _all: true },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 10
    });
    
    // Tendencia diaria (últimos 30 días)
    const diasRecientes = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().substring(0, 10); // Formato YYYY-MM-DD
    }).reverse();
    
    // Consultar datos para cada día
    const busquedasPorDia = await Promise.all(diasRecientes.map(async (dia) => {
      const inicio = new Date(`${dia}T00:00:00Z`);
      const fin = new Date(`${dia}T23:59:59.999Z`);
      
      const count = await prisma.busqueda.count({
        where: { 
          fecha: {
            gte: inicio,
            lte: fin
          }
        }
      });
      
      return {
        dia: inicio.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
        cantidad: count
      };
    }));
    
    res.status(200).json({
      total: totalBusquedas,
      porTipoEntidad: busquedasPorTipo,
      porUbicacion: busquedasPorUbicacion.filter(b => b.ubicacion), // Filtrar ubicaciones nulas
      tendenciaDiaria: busquedasPorDia
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de búsquedas:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas de búsquedas'
    });
  }
};

// Obtener estadísticas financieras
const getFinancialStats = async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // Total de ingresos
    const ingresos = await prisma.pago.aggregate({
      where: { estado: 'completado' },
      _sum: { monto: true }
    });
    
    // Ingresos por plan
    const ingresosPorPlan = await prisma.pago.groupBy({
      by: ['planId'],
      where: { estado: 'completado' },
      _sum: { monto: true }
    });
    
    // Obtener nombres de planes
    const planesIds = ingresosPorPlan.map(p => p.planId);
    const infoPlanes = await prisma.plan.findMany({
      where: {
        id: { in: planesIds }
      },
      select: {
        id: true,
        nombre: true
      }
    });
    
    // Combinar datos
    const ingresosPorPlanConNombre = ingresosPorPlan.map(p => ({
      planId: p.planId,
      nombre: infoPlanes.find(plan => plan.id === p.planId)?.nombre || 'Plan desconocido',
      ingresos: p._sum.monto
    }));
    
    // Ingresos por método de pago
    const ingresosPorMetodo = await prisma.pago.groupBy({
      by: ['metodoPago'],
      where: { estado: 'completado' },
      _sum: { monto: true }
    });
    
    // Tendencia mensual (últimos 12 meses)
    const mesesRecientes = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7); // Formato YYYY-MM
    }).reverse();
    
    // Consultar datos para cada mes
    const ingresosPorMes = await Promise.all(mesesRecientes.map(async (mes) => {
      const inicio = new Date(`${mes}-01T00:00:00Z`);
      const siguienteMes = new Date(inicio);
      siguienteMes.setMonth(siguienteMes.getMonth() + 1);
      
      const ingreso = await prisma.pago.aggregate({
        where: { 
          estado: 'completado',
          fecha: {
            gte: inicio,
            lt: siguienteMes
          }
        },
        _sum: { monto: true }
      });
      
      return {
        mes: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
        ingresos: ingreso._sum.monto || 0
      };
    }));
    
    res.status(200).json({
      totalIngresos: ingresos._sum.monto || 0,
      porPlan: ingresosPorPlanConNombre,
      porMetodoPago: ingresosPorMetodo,
      tendenciaMensual: ingresosPorMes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas financieras:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener las estadísticas financieras'
    });
  }
};

// Obtener datos para gráficos de tendencias
const getTrendData = async (req, res) => {
  try {
    const prisma = req.prisma;
    const { periodo = 'mensual', meses = 12 } = req.query;
    
    let periodos = [];
    let inicio, fin;
    
    if (periodo === 'mensual') {
      // Últimos N meses
      periodos = Array.from({ length: Number(meses) }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().substring(0, 7); // Formato YYYY-MM
      }).reverse();
    } else if (periodo === 'semanal') {
      // Últimas 12 semanas
      periodos = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        return { 
          inicio: new Date(date.setDate(date.getDate() - date.getDay())),
          fin: new Date(new Date(date).setDate(date.getDate() + 6))
        };
      }).reverse();
    } else if (periodo === 'diario') {
      // Últimos 30 días
      periodos = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().substring(0, 10); // Formato YYYY-MM-DD
      }).reverse();
    }
    
    // Obtener tendencias para diferentes métricas
    let datosTendencia;
    
    if (periodo === 'mensual') {
      // Datos mensuales
      datosTendencia = await Promise.all(periodos.map(async (mes) => {
        const inicio = new Date(`${mes}-01T00:00:00Z`);
        const siguienteMes = new Date(inicio);
        siguienteMes.setMonth(siguienteMes.getMonth() + 1);
        
        // Usuarios nuevos
        const usuariosNuevos = await prisma.usuario.count({
          where: { 
            fechaCreacion: {
              gte: inicio,
              lt: siguienteMes
            }
          }
        });
        
        // Consumo de créditos
        const consumoCreditos = await prisma.credito.aggregate({
          where: { 
            tipo: 'consumo',
            fecha: {
              gte: inicio,
              lt: siguienteMes
            }
          },
          _sum: { cantidad: true }
        });
        
        // Búsquedas realizadas
        const busquedas = await prisma.busqueda.count({
          where: { 
            fecha: {
              gte: inicio,
              lt: siguienteMes
            }
          }
        });
        
        // Ingresos
        const ingresos = await prisma.pago.aggregate({
          where: { 
            estado: 'completado',
            fecha: {
              gte: inicio,
              lt: siguienteMes
            }
          },
          _sum: { monto: true }
        });
        
        return {
          periodo: `${inicio.toLocaleString('es-CO', { month: 'short' })} ${inicio.getFullYear()}`,
          usuariosNuevos,
          consumoCreditos: consumoCreditos._sum.cantidad || 0,
          busquedas,
          ingresos: ingresos._sum.monto || 0
        };
      }));
    } else if (periodo === 'semanal') {
      // Datos semanales
      datosTendencia = await Promise.all(periodos.map(async (semana, index) => {
        // Usuarios nuevos
        const usuariosNuevos = await prisma.usuario.count({
          where: { 
            fechaCreacion: {
              gte: semana.inicio,
              lte: semana.fin
            }
          }
        });
        
        // Consumo de créditos
        const consumoCreditos = await prisma.credito.aggregate({
          where: { 
            tipo: 'consumo',
            fecha: {
              gte: semana.inicio,
              lte: semana.fin
            }
          },
          _sum: { cantidad: true }
        });
        
        // Búsquedas realizadas
        const busquedas = await prisma.busqueda.count({
          where: { 
            fecha: {
              gte: semana.inicio,
              lte: semana.fin
            }
          }
        });
        
        return {
          periodo: `Sem ${12 - index}`,
          usuariosNuevos,
          consumoCreditos: consumoCreditos._sum.cantidad || 0,
          busquedas
        };
      }));
    } else if (periodo === 'diario') {
      // Datos diarios
      datosTendencia = await Promise.all(periodos.map(async (dia) => {
        const inicio = new Date(`${dia}T00:00:00Z`);
        const fin = new Date(`${dia}T23:59:59.999Z`);
        
        // Consumo de créditos
        const consumoCreditos = await prisma.credito.aggregate({
          where: { 
            tipo: 'consumo',
            fecha: {
              gte: inicio,
              lte: fin
            }
          },
          _sum: { cantidad: true }
        });
        
        // Búsquedas realizadas
        const busquedas = await prisma.busqueda.count({
          where: { 
            fecha: {
              gte: inicio,
              lte: fin
            }
          }
        });
        
        return {
          periodo: inicio.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          consumoCreditos: consumoCreditos._sum.cantidad || 0,
          busquedas
        };
      }));
    }
    
    res.status(200).json({
      periodo,
      datosTendencia
    });
  } catch (error) {
    console.error('Error al obtener datos de tendencias:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener los datos de tendencias'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUserStats,
  getCreditStats,
  getSocialNetworkStats,
  getSearchStats,
  getFinancialStats,
  getTrendData
};
