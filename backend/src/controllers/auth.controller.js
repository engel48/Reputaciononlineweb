const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const authConfig = require('../config/auth.config');

const login = async (req, res) => {
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Buscar usuario en la base de datos
    const prisma = req.prisma;
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    // Si no existe el usuario o no es administrador
    if (!user || user.rol !== 'admin') {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Correo electrónico o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Correo electrónico o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, role: user.rol },
      authConfig.JWT_SECRET,
      { expiresIn: authConfig.JWT_EXPIRATION }
    );

    // Responder con token y datos del usuario
    res.status(200).json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      accessToken: token
    });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al procesar la solicitud de inicio de sesión'
    });
  }
};

const verifyToken = (req, res) => {
  const token = req.headers['x-access-token'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'No se proporcionó token de autenticación'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, authConfig.JWT_SECRET);
    
    res.status(200).json({
      valid: true,
      userId: decoded.id,
      role: decoded.role
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Token inválido',
      message: 'La sesión ha expirado o el token es inválido'
    });
  }
};

const logout = (req, res) => {
  // En el lado del servidor no podemos invalidar tokens JWT
  // ya que son stateless. La invalidación se maneja en el cliente
  // eliminando el token de su almacenamiento local.
  
  res.status(200).json({
    message: 'Sesión cerrada exitosamente'
  });
};

module.exports = {
  login,
  verifyToken,
  logout
};
