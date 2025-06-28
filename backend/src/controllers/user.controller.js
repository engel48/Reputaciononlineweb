const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const prisma = req.prisma;
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        fechaCreacion: true,
        ultimoAcceso: true,
        estado: true,
        planId: true,
        plan: {
          select: {
            nombre: true
          }
        },
        _count: {
          select: { 
            creditos: true,
            redesSociales: true
          }
        }
      }
    });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener la lista de usuarios'
    });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: {
        plan: true,
        creditos: {
          orderBy: { fecha: 'desc' },
          take: 10
        },
        redesSociales: true,
        pagos: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${id}`
      });
    }

    // Ocultar la contraseña en la respuesta
    const { password, ...usuarioSinPassword } = usuario;
    res.status(200).json(usuarioSinPassword);
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener la información del usuario'
    });
  }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, email, password, rol } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si el correo ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Correo ya registrado',
        message: 'El correo electrónico ya está registrado en el sistema'
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol,
        estado: 'activo',
        fechaCreacion: new Date(),
        ultimoAcceso: new Date()
      }
    });

    // Ocultar la contraseña en la respuesta
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;
    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al crear el nuevo usuario'
    });
  }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { nombre, email, rol, estado, password } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${id}`
      });
    }

    // Preparar los datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (rol) updateData.rol = rol;
    if (estado) updateData.estado = estado;

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar el usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData
    });

    // Ocultar la contraseña en la respuesta
    const { password: _, ...usuarioSinPassword } = usuarioActualizado;
    res.status(200).json(usuarioSinPassword);
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al actualizar la información del usuario'
    });
  }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${id}`
      });
    }

    // Eliminar el usuario
    await prisma.usuario.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al eliminar el usuario'
    });
  }
};

// Asignar plan a usuario
const assignPlan = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { planId } = req.body;

  try {
    const prisma = req.prisma;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${id}`
      });
    }

    // Verificar si el plan existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: Number(planId) }
    });

    if (!existingPlan) {
      return res.status(404).json({
        error: 'Plan no encontrado',
        message: `No se encontró un plan con el ID ${planId}`
      });
    }

    // Asignar el plan al usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        planId: Number(planId),
        fechaActualizacion: new Date()
      },
      include: {
        plan: true
      }
    });

    // Registrar asignación de créditos según el plan
    await prisma.credito.create({
      data: {
        usuarioId: Number(id),
        cantidad: existingPlan.creditos,
        tipo: 'asignacion',
        descripcion: `Asignación de créditos por plan: ${existingPlan.nombre}`,
        fecha: new Date()
      }
    });

    // Registrar el pago (si aplica)
    if (req.body.registrarPago) {
      await prisma.pago.create({
        data: {
          usuarioId: Number(id),
          planId: Number(planId),
          monto: existingPlan.precio,
          metodoPago: req.body.metodoPago || 'administrativo',
          estado: 'completado',
          referenciaPago: req.body.referenciaPago || `Admin-${Date.now()}`,
          fecha: new Date(),
          descripcion: `Pago por plan: ${existingPlan.nombre}`
        }
      });
    }

    res.status(200).json({
      message: 'Plan asignado correctamente',
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        planActual: usuarioActualizado.plan.nombre,
        creditosAsignados: existingPlan.creditos
      }
    });
  } catch (error) {
    console.error(`Error al asignar plan al usuario con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al asignar el plan al usuario'
    });
  }
};

// Obtener detalles de actividad del usuario
const getUserActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = req.prisma;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró un usuario con el ID ${id}`
      });
    }

    // Obtener consumo de créditos
    const consumoCreditos = await prisma.credito.findMany({
      where: {
        usuarioId: Number(id),
        tipo: 'consumo'
      },
      orderBy: { fecha: 'desc' },
      take: 100
    });

    // Obtener búsquedas realizadas
    const busquedas = await prisma.busqueda.findMany({
      where: { usuarioId: Number(id) },
      orderBy: { fecha: 'desc' },
      take: 50
    });

    // Obtener análisis realizados
    const analisis = await prisma.analisis.findMany({
      where: { usuarioId: Number(id) },
      orderBy: { fecha: 'desc' },
      take: 20
    });

    // Obtener redes sociales conectadas
    const redesSociales = await prisma.redSocial.findMany({
      where: { usuarioId: Number(id) }
    });

    res.status(200).json({
      consumoCreditos,
      busquedas,
      analisis,
      redesSociales,
      totalRegistros: {
        consumoCreditos: consumoCreditos.length,
        busquedas: busquedas.length,
        analisis: analisis.length,
        redesSociales: redesSociales.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener actividad del usuario con ID ${id}:`, error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al obtener la actividad del usuario'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignPlan,
  getUserActivity
};
