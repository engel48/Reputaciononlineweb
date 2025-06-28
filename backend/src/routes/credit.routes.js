const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const creditController = require('../controllers/credit.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rutas protegidas por autenticación
router.use(authMiddleware);

// Obtener todos los registros de créditos
router.get('/', creditController.getAllCredits);

// Obtener créditos por usuario
router.get('/usuario/:usuarioId', creditController.getCreditsByUser);

// Obtener estadísticas de créditos
router.get('/stats/summary', creditController.getCreditStats);

// Asignar créditos a un usuario
router.post('/asignar', [
  body('usuarioId').isNumeric().withMessage('ID de usuario inválido'),
  body('cantidad').isNumeric().withMessage('La cantidad debe ser un valor numérico'),
  body('motivo').notEmpty().withMessage('El motivo es obligatorio')
], creditController.assignCredits);

// Registrar consumo de créditos
router.post('/consumir', [
  body('usuarioId').isNumeric().withMessage('ID de usuario inválido'),
  body('cantidad').isNumeric().withMessage('La cantidad debe ser un valor numérico'),
  body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
  body('tipo').isIn(['búsqueda', 'análisis', 'reporte']).withMessage('Tipo de consumo inválido')
], creditController.recordCreditUsage);

// Obtener historial de transacciones de créditos
router.get('/historial/:usuarioId', creditController.getCreditHistory);

// Obtener informe de consumo por tipo
router.get('/informe/tipo', creditController.getCreditUsageByType);

// Obtener informe de consumo diario/mensual
router.get('/informe/periodo', creditController.getCreditUsageByPeriod);

module.exports = router;
