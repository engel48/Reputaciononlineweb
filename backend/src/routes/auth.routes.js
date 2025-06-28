const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

// Ruta para iniciar sesiu00f3n de administrador
router.post('/login', [
  body('email').isEmail().withMessage('Por favor ingrese un correo electru00f3nico vu00e1lido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseu00f1a debe tener al menos 6 caracteres')
], authController.login);

// Ruta para verificar token JWT
router.get('/verify', authController.verifyToken);

// Ruta para cerrar sesiu00f3n
router.post('/logout', authController.logout);

module.exports = router;
