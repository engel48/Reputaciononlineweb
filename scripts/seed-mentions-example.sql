-- Script para insertar menciones de ejemplo en Supabase
-- Ejecutar este script DESPUÉS de tener al menos un usuario en la tabla users

-- NOTA: Reemplaza 'TU_USER_ID_AQUI' con un user_id real de tu tabla users
-- Para obtener un user_id válido, ejecuta: SELECT id FROM users LIMIT 1;

-- Variables de ejemplo (ajustar según necesidad)
-- SET @user_id = 'TU_USER_ID_AQUI';

-- Menciones de YouTube (últimas 24 horas)
INSERT INTO mentions (
  user_id,
  platform,
  author_username,
  author_name,
  author_followers,
  content,
  url,
  published_at,
  scraped_at,
  likes,
  shares,
  comments,
  reach_estimate,
  metadata
) VALUES
-- Mención positiva reciente (2 horas atrás)
(
  'TU_USER_ID_AQUI',
  'youtube',
  '@mariatech',
  'María González Tech',
  15200,
  'Excelente análisis de reputación online! Este video me ayudó a mejorar mi presencia digital. Muy recomendado 👍',
  'https://youtube.com/watch?v=example1',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour',
  342,
  89,
  45,
  15200,
  '{"sentiment": "positive", "location": "Bogotá, Colombia", "verified": true, "sentimentScore": 0.85}'::jsonb
),

-- Mención neutral (5 horas atrás)
(
  'TU_USER_ID_AQUI',
  'youtube',
  '@carlosrodriguez',
  'Carlos Rodríguez',
  8900,
  'Información útil sobre monitoreo de marca. Algunos puntos podrían estar más actualizados pero en general es bueno.',
  'https://youtube.com/watch?v=example2',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '4 hours',
  156,
  34,
  22,
  8900,
  '{"sentiment": "neutral", "location": "Medellín, Colombia", "verified": false, "sentimentScore": 0.05}'::jsonb
),

-- Mención positiva (8 horas atrás)
(
  'TU_USER_ID_AQUI',
  'youtube',
  '@anamarketing',
  'Ana Martínez | Marketing Digital',
  32500,
  '¡Impresionante plataforma! La uso diariamente para monitorear la reputación de mis clientes. Resultados increíbles 🚀',
  'https://youtube.com/watch?v=example3',
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '7 hours',
  589,
  145,
  78,
  32500,
  '{"sentiment": "positive", "location": "Cali, Colombia", "verified": true, "sentimentScore": 0.92}'::jsonb
),

-- Menciones de X/Twitter
-- Mención positiva (1 hora atrás)
(
  'TU_USER_ID_AQUI',
  'x',
  '@juanempresario',
  'Juan Pérez',
  5600,
  'Increíble herramienta para monitorear lo que dicen de mi marca. Ya recuperé varios clientes gracias a alertas en tiempo real! @ReputacionOnline',
  'https://x.com/juanempresario/status/example1',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '30 minutes',
  234,
  56,
  18,
  5600,
  '{"sentiment": "positive", "location": "Barranquilla, Colombia", "verified": false, "sentimentScore": 0.78}'::jsonb
),

-- Mención negativa (3 horas atrás)
(
  'TU_USER_ID_AQUI',
  'x',
  '@usuario_critico',
  'Crítico Digital',
  12300,
  'No logro conectar todas mis redes sociales. El soporte técnico tarda en responder. Esperaba más rapidez.',
  'https://x.com/usuario_critico/status/example2',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours',
  45,
  12,
  8,
  12300,
  '{"sentiment": "negative", "location": "Bogotá, Colombia", "verified": false, "sentimentScore": -0.65}'::jsonb
),

-- Menciones de Facebook
-- Mención positiva (4 horas atrás)
(
  'TU_USER_ID_AQUI',
  'facebook',
  'laura.gomez',
  'Laura Gómez',
  3200,
  'Como community manager, esta plataforma me ha salvado la vida. Puedo ver todas las menciones de mis clientes en un solo lugar. 10/10',
  'https://facebook.com/laura.gomez/posts/example1',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '3 hours',
  178,
  42,
  31,
  3200,
  '{"sentiment": "positive", "location": "Cartagena, Colombia", "verified": false, "sentimentScore": 0.88}'::jsonb
),

-- Mención neutral (6 horas atrás)
(
  'TU_USER_ID_AQUI',
  'facebook',
  'pedro.sanchez',
  'Pedro Sánchez',
  1800,
  'Probando la versión gratuita. Tiene funciones interesantes, pero me gustaría ver más integración con otras plataformas.',
  'https://facebook.com/pedro.sanchez/posts/example2',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '5 hours',
  23,
  5,
  7,
  1800,
  '{"sentiment": "neutral", "location": "Pereira, Colombia", "verified": false, "sentimentScore": 0.12}'::jsonb
),

-- Menciones de Instagram
-- Mención positiva (7 horas atrás)
(
  'TU_USER_ID_AQUI',
  'instagram',
  '@sofia_influencer',
  'Sofía Ramírez ✨',
  45600,
  'Les recomiendo @reputaciononline si quieren saber qué dice la gente de su marca. Yo lo uso para mis colaboraciones y es súper útil! 💯✨',
  'https://instagram.com/p/example1',
  NOW() - INTERVAL '7 hours',
  NOW() - INTERVAL '6 hours',
  1234,
  89,
  156,
  45600,
  '{"sentiment": "positive", "location": "Bogotá, Colombia", "verified": true, "sentimentScore": 0.91}'::jsonb
),

-- Mención positiva (10 horas atrás)
(
  'TU_USER_ID_AQUI',
  'instagram',
  '@empresario_digital',
  'Diego Castro',
  18900,
  'Desde que uso esta plataforma, mi engagement ha subido 40%. No es magia, es monitoreo inteligente de reputación 📊',
  'https://instagram.com/p/example2',
  NOW() - INTERVAL '10 hours',
  NOW() - INTERVAL '9 hours',
  567,
  78,
  92,
  18900,
  '{"sentiment": "positive", "location": "Medellín, Colombia", "verified": false, "sentimentScore": 0.84}'::jsonb
),

-- Mención neutral (12 horas atrás)
(
  'TU_USER_ID_AQUI',
  'instagram',
  '@marketing_tips',
  'Marketing Tips Colombia',
  28400,
  'Estoy probando varias herramientas de monitoreo de reputación. Esta está en mi top 3. Les cuento más en mi próximo post.',
  'https://instagram.com/p/example3',
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '11 hours',
  389,
  45,
  67,
  28400,
  '{"sentiment": "neutral", "location": "Cali, Colombia", "verified": true, "sentimentScore": 0.18}'::jsonb
);

-- Verificar menciones insertadas
SELECT
  platform,
  COUNT(*) as total,
  SUM(CASE WHEN (metadata->>'sentiment') = 'positive' THEN 1 ELSE 0 END) as positivas,
  SUM(CASE WHEN (metadata->>'sentiment') = 'negative' THEN 1 ELSE 0 END) as negativas,
  SUM(CASE WHEN (metadata->>'sentiment') = 'neutral' THEN 1 ELSE 0 END) as neutrales
FROM mentions
WHERE user_id = 'TU_USER_ID_AQUI'
GROUP BY platform
ORDER BY platform;
