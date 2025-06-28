const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

module.exports = (req, res, next) => {
  // Obtener token del encabezado
  const token = req.headers['x-access-token'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Acceso no autorizado',
      message: 'No se proporcionó token de autenticación'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'La sesión ha expirado o el token es inválido'
    });
  }
};
