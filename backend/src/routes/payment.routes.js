const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rutas protegidas por autenticación
router.use(authMiddleware);

// Obtener todos los pagos
router.get('/', paymentController.getAllPayments);

// Obtener un pago por ID
router.get('/:id', paymentController.getPaymentById);

// Crear un nuevo registro de pago
router.post('/', [
  body('usuarioId').isNumeric().withMessage('ID de usuario inválido'),
  body('planId').isNumeric().withMessage('ID de plan inválido'),
  body('monto').isNumeric().withMessage('El monto debe ser un valor numérico'),
  body('metodoPago').isIn(['tarjeta', 'transferencia', 'efectivo']).withMessage('Método de pago inválido'),
  body('estado').isIn(['pendiente', 'completado', 'rechazado']).withMessage('Estado inválido')
], paymentController.createPayment);

// Actualizar un pago
router.put('/:id', [
  body('estado').isIn(['pendiente', 'completado', 'rechazado']).withMessage('Estado inválido'),
  body('referenciaPago').optional().notEmpty().withMessage('La referencia no puede estar vacía')
], paymentController.updatePayment);

// Generar factura
router.get('/:id/factura', paymentController.generateInvoice);

// Obtener estadísticas de pagos
router.get('/stats/summary', paymentController.getPaymentStats);

// Obtener pagos por usuario
router.get('/usuario/:usuarioId', paymentController.getPaymentsByUser);

module.exports = router;
