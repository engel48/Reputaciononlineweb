const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rutas protegidas por autenticación
router.use(authMiddleware);

// Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// Obtener un usuario por ID
router.get('/:id', userController.getUserById);

// Crear un nuevo usuario
router.post('/', [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Correo electrónico inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').isIn(['admin', 'usuario']).withMessage('Rol inválido')
], userController.createUser);

// Actualizar un usuario
router.put('/:id', [
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Correo electrónico inválido'),
  body('rol').optional().isIn(['admin', 'usuario']).withMessage('Rol inválido')
], userController.updateUser);

// Eliminar un usuario
router.delete('/:id', userController.deleteUser);

// Asignar plan a usuario
router.post('/:id/plan', [
  body('planId').isNumeric().withMessage('ID de plan inválido')
], userController.assignPlan);

// Obtener detalles de actividad del usuario
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;
