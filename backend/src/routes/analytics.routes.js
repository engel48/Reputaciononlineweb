const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rutas protegidas por autenticaciu00f3n
router.use(authMiddleware);

// Obtener estadu00edsticas generales del dashboard
router.get('/dashboard', analyticsController.getDashboardStats);

// Obtener estadu00edsticas de usuarios
router.get('/usuarios', analyticsController.getUserStats);

// Obtener estadu00edsticas de consumo de cru00e9ditos
router.get('/creditos', analyticsController.getCreditStats);

// Obtener estadu00edsticas de redes sociales conectadas
router.get('/redes-sociales', analyticsController.getSocialNetworkStats);

// Obtener estadu00edsticas de bu00fasquedas realizadas
router.get('/busquedas', analyticsController.getSearchStats);

// Obtener estadu00edsticas financieras
router.get('/finanzas', analyticsController.getFinancialStats);

// Obtener datos para gru00e1ficos de tendencias
router.get('/tendencias', analyticsController.getTrendData);

module.exports = router;
