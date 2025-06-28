const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const planRoutes = require('./routes/plan.routes');
const paymentRoutes = require('./routes/payment.routes');
const creditRoutes = require('./routes/credit.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Inicializar Prisma
const prisma = new PrismaClient();

// Configuración
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Middleware para proporcionar prisma a las rutas
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/analytics', analyticsRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend administrativo de Reputación Online funcionando correctamente' });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor administrativo ejecutándose en http://localhost:${PORT}`);
});

// Manejar cierre de la aplicación
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Conexión a la base de datos cerrada');
  process.exit(0);
});
