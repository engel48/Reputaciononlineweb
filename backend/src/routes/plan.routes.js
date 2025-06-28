const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rutas protegidas por autenticación
router.use(authMiddleware);

// Obtener todos los planes
router.get('/', planController.getAllPlans);

// Obtener un plan por ID
router.get('/:id', planController.getPlanById);

// Crear un nuevo plan
router.post('/', [
  body('nombre').notEmpty().withMessage('El nombre del plan es obligatorio'),
  body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
  body('precio').isNumeric().withMessage('El precio debe ser un valor numérico'),
  body('creditos').isNumeric().withMessage('La cantidad de créditos debe ser un valor numérico'),
  body('duracion').isNumeric().withMessage('La duración debe ser un valor numérico en días')
], planController.createPlan);

// Actualizar un plan
router.put('/:id', [
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
  body('precio').optional().isNumeric().withMessage('El precio debe ser un valor numérico'),
  body('creditos').optional().isNumeric().withMessage('La cantidad de créditos debe ser un valor numérico'),
  body('duracion').optional().isNumeric().withMessage('La duración debe ser un valor numérico en días')
], planController.updatePlan);

// Eliminar un plan
router.delete('/:id', planController.deletePlan);

// Obtener estadísticas de planes
router.get('/stats/summary', planController.getPlanStats);

module.exports = router;
