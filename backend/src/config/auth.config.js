module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'reputacion-online-secret-key',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@reputaciononline.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '$2a$10$1JRXMuKGN9n6UUJtaqoLIeqZQKilFisxJKKs9RPZE1SZU.e4D9vhO' // password: Admin123*
};
