# Sistema de Scraping de Noticias Colombianas

Sistema completo de scraping en tiempo real para 50+ sitios de noticias importantes de Colombia con caching, rate limiting y seguridad.

## Características

- **50+ Sitios Configurados**: Cobertura completa de medios nacionales, regionales, digitales, económicos y deportivos
- **Scraping en Tiempo Real**: Extracción instantánea usando Cheerio con selectores CSS optimizados
- **Sistema de Cache**: TTL de 5 minutos para optimizar performance
- **Rate Limiting**: Control de tasa por IP y por sitio para evitar sobrecarga
- **Manejo Robusto de Errores**: Reintentos automáticos, circuit breakers y fallback a datos cacheados
- **Seguridad**: Validación de URLs, sanitización de HTML, headers de seguridad
- **Base de Datos**: Almacenamiento persistente con índices optimizados
- **API REST Completa**: Endpoints para listado, scraping individual y masivo

## Arquitectura

```
/src/lib/scraping/
├── sitios-config.ts       # Configuración de 50 sitios con selectores CSS
├── noticias-colombia.ts   # Motor de scraping con Cheerio
├── cache.ts               # Sistema de cache con TTL de 5 minutos
└── rate-limiter.ts        # Rate limiting y seguridad

/src/app/api/noticias-colombia/
├── sitios/route.ts        # GET /api/noticias-colombia/sitios
├── scrape/route.ts        # GET /api/noticias-colombia/scrape
└── scrape-all/route.ts    # POST /api/noticias-colombia/scrape-all

/prisma/migrations/
└── 20250121_noticias_colombia.sql  # Schema de base de datos
```

## Instalación y Setup

### 1. Inicializar Base de Datos

```bash
# Ejecutar migración SQL
node scripts/init-noticias-tables.js
```

Esto creará las siguientes tablas:
- `sitios_noticias` - Configuración de sitios
- `noticias_colombia` - Artículos scrapeados
- `scraping_cache` - Cache de resultados
- `scraping_logs` - Logs de scraping

### 2. Verificar Configuración

```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar sitios disponibles
curl http://localhost:3000/api/noticias-colombia/sitios
```

## API Endpoints

### 1. Listar Sitios Disponibles

**Endpoint:** `GET /api/noticias-colombia/sitios`

**Query Parameters:**
- `categoria` (opcional): Filtrar por categoría (nacional, regional, digital, economico, deportivo)
- `activos` (opcional): Solo sitios activos (true/false)
- `stats` (opcional): Incluir estadísticas de scraping (true/false)
- `limit` (opcional): Límite de resultados (default: 50)
- `offset` (opcional): Offset para paginación (default: 0)

**Ejemplo:**
```bash
curl "http://localhost:3000/api/noticias-colombia/sitios?categoria=nacional&activos=true&stats=true"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sitios": [
      {
        "id": "eltiempo",
        "nombre": "El Tiempo",
        "url": "https://www.eltiempo.com",
        "categoria": "nacional",
        "scrapingActivo": true,
        "stats": {
          "ultimoScrape": "2025-01-21T10:30:00Z",
          "totalScrapes": 150,
          "scrapesExitosos": 145,
          "scrapesFallidos": 5,
          "tasaExito": 96.67
        }
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "summary": {
      "totalSitios": 50,
      "sitiosActivos": 47,
      "categorias": {
        "nacional": 8,
        "regional": 15,
        "digital": 13,
        "economico": 3,
        "deportivo": 5
      }
    }
  }
}
```

### 2. Scrapear Sitio Específico

**Endpoint:** `GET /api/noticias-colombia/scrape`

**Query Parameters:**
- `sitio` (requerido): ID del sitio a scrapear
- `refresh` (opcional): Forzar refresh ignorando cache (true/false)
- `limit` (opcional): Número de artículos (default: 20)
- `offset` (opcional): Offset para paginación (default: 0)

**Ejemplo:**
```bash
curl "http://localhost:3000/api/noticias-colombia/scrape?sitio=eltiempo&limit=10"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sitio": {
      "id": "eltiempo",
      "nombre": "El Tiempo",
      "url": "https://www.eltiempo.com",
      "categoria": "nacional"
    },
    "scraping": {
      "success": true,
      "cached": false,
      "timestamp": "2025-01-21T10:35:00Z",
      "durationMs": 1250
    },
    "articles": [
      {
        "id": "article_abc123",
        "sitioId": "eltiempo",
        "titulo": "Gobierno presenta reforma tributaria",
        "descripcion": "El Ministro de Hacienda radicó el proyecto...",
        "url": "https://www.eltiempo.com/politica/reforma-tributaria-2025",
        "imagenUrl": "https://www.eltiempo.com/files/image.jpg",
        "autor": "Redacción Política",
        "fechaPublicacion": "2025-01-21T09:00:00Z",
        "categoria": "política",
        "scrapedAt": "2025-01-21T10:35:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  },
  "processingTime": 1250
}
```

### 3. Scraping Masivo (Admin)

**Endpoint:** `POST /api/noticias-colombia/scrape-all`

**Body Parameters:**
```json
{
  "sitios": ["eltiempo", "elespectador", "semana"],
  "categoria": "nacional",
  "concurrency": 3
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/noticias-colombia/scrape-all \
  -H "Content-Type: application/json" \
  -d '{"categoria": "nacional", "concurrency": 3}'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "sitioId": "eltiempo",
        "sitioNombre": "El Tiempo",
        "success": true,
        "articlesCount": 45,
        "durationMs": 1250
      },
      {
        "sitioId": "elespectador",
        "sitioNombre": "El Espectador",
        "success": true,
        "articlesCount": 38,
        "durationMs": 980
      }
    ],
    "stats": {
      "total": 8,
      "successful": 7,
      "failed": 1,
      "totalArticles": 312,
      "averageDuration": 1150
    },
    "configuration": {
      "sitiosScraped": 8,
      "concurrency": 3,
      "categoria": "nacional"
    }
  },
  "totalDuration": 5420
}
```

## Sitios Configurados

### Nacionales (8)
1. El Tiempo (eltiempo)
2. El Espectador (elespectador)
3. Semana (semana)
4. RCN Radio (rcn)
5. Caracol Radio (caracol)
6. Blu Radio (bluradio)
7. W Radio (wradio)
8. La FM (lafm)

### Regionales (15)
9. El Colombiano (elcolombiano) - Antioquia
10. El Heraldo (elheraldo) - Atlántico
11. El Universal (eluniversal) - Bolívar
12. Vanguardia (vanguardia) - Santander
13. El País (elpais) - Valle del Cauca
14. La Patria (lapatria) - Caldas
15. Diario del Huila (diariodelhuila) - Huila
16. La Opinión (laopinion) - Norte de Santander
17. El Nuevo Siglo (elnuevosiglo)
18. El Pilón (elpilon)
19. La Nación (lanacion)
20. El Liberal (elliberal)
21. El Diario del Otún (eldiario)
22. (y más...)

### Digitales (13)
23. Pulzo (pulzo)
24. Las 2 Orillas (las2orillas)
25. La Silla Vacía (lasillavacia)
26. Razón Pública (razonpublica)
27. KienyKe (kienyke)
28. Infobae Colombia (infobae)
29. CNN Colombia (cnn)
30. Noticias RCN (noticiasrcn)
31. Noticias Caracol (noticiascaracol)
32. City TV (citytv)
33. Confidencial Colombia (confidencial)
34. Colombia Informa (colombiainforma)
35. Cambio Colombia (cambiocolombia)

### Económicos (3)
36. Portafolio (portafolio)
37. La República (larepublica)
38. Dinero (dinero)
39. Valora Analitik (valoraanalitik)
40. Ámbito Jurídico (ambitojuridico)

### Deportivos (5)
41. Gol Caracol (golcaracol)
42. AS Colombia (ascolombia)
43. Futbolred (futbolred)
44. Antena 2 (antena2)

## Configuración de Selectores CSS

Cada sitio tiene configurados los siguientes selectores:

```typescript
{
  articulos: 'article.article',      // Contenedor de lista de artículos
  titulo: 'h2.title, h3.title',      // Selector de título
  descripcion: 'p.summary',          // Selector de descripción
  url: 'a.link',                     // Selector de URL
  imagen: 'img.image',               // Selector de imagen
  fecha: 'time',                     // Selector de fecha
  autor: 'span.author',              // Selector de autor
  categoria: 'span.category'         // Selector de categoría
}
```

## Rate Limiting

### Límites por IP:
- **Scraping general**: 30 requests/minuto
- **Scraping masivo**: 5 requests/hora
- **Listado de sitios**: 100 requests/minuto

### Límites por Sitio:
- **Por defecto**: 10 requests/minuto por sitio
- **Timeout**: 10 segundos por request

### Límites por Usuario:
- **Scraping**: 100 requests/hora

## Cache

- **TTL**: 5 minutos
- **Invalidación**: Automática al expirar o manual
- **Almacenamiento**: Base de datos con índices
- **Hit tracking**: Estadísticas de uso de cache

## Manejo de Errores

### Estrategias:
1. **Exponential Backoff**: Reintentos con delay incremental (max 3 reintentos)
2. **Circuit Breaker**: Pausa de 5 minutos después de 5 fallos consecutivos
3. **Graceful Degradation**: Fallback a datos cacheados si scraping falla
4. **Logging**: Registro detallado de errores en `scraping_logs`

### Tipos de Error:
- `timeout`: Request excedió tiempo límite
- `rate_limited`: Límite de tasa excedido
- `parse_error`: Error al parsear HTML
- `network_error`: Error de conexión
- `invalid_response`: Respuesta HTTP no válida

## Seguridad

### Validaciones:
- ✅ Sanitización de HTML scrapeado
- ✅ Validación de URLs (solo HTTP/HTTPS)
- ✅ Bloqueo de IPs privadas y localhost
- ✅ Validación de IDs de sitio (solo alfanuméricos y guiones)
- ✅ Headers de seguridad en respuestas

### Headers de Seguridad:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## Monitoreo y Logs

### Estadísticas Disponibles:
- Total de scrapes por sitio
- Tasa de éxito/fallo
- Duración promedio
- Número de artículos encontrados
- Uso de cache (hit rate)

### Logs:
```sql
SELECT * FROM scraping_logs
WHERE sitio_id = 'eltiempo'
ORDER BY created_at DESC
LIMIT 10;
```

## Performance

### Optimizaciones:
- ✅ Cache de 5 minutos reduce carga en sitios fuente
- ✅ Índices en base de datos para queries rápidas
- ✅ Concurrency control en scraping masivo
- ✅ Timeouts configurables por sitio
- ✅ Lazy loading de artículos (paginación)

### Benchmarks:
- Scraping individual: ~1-3 segundos
- Cache hit: <100ms
- Scraping masivo (10 sitios): ~15-30 segundos

## Extender el Sistema

### Agregar Nuevo Sitio:

1. Agregar configuración en `/src/lib/scraping/sitios-config.ts`:

```typescript
{
  id: 'nuevo-sitio',
  nombre: 'Nuevo Sitio',
  url: 'https://www.nuevositio.com',
  logoUrl: '/logos/nuevo-sitio.png',
  categoria: 'digital',
  scrapingActivo: true,
  selectores: {
    articulos: 'article',
    titulo: 'h2.title',
    descripcion: 'p.excerpt',
    url: 'a.link',
    imagen: 'img',
    fecha: 'time'
  },
  maxRequestsPerMinute: 10,
  timeoutSegundos: 10
}
```

2. Reiniciar servidor y probar:

```bash
curl "http://localhost:3000/api/noticias-colombia/scrape?sitio=nuevo-sitio"
```

## Troubleshooting

### Problema: Scraping falla con timeout

**Solución**: Aumentar `timeoutSegundos` en configuración del sitio

### Problema: Cache no se invalida

**Solución**: Usar parámetro `refresh=true` para forzar actualización

### Problema: Rate limit excedido

**Solución**: Esperar tiempo indicado en `retryAfter` o usar scraping masivo con concurrency menor

### Problema: Selectores CSS no funcionan

**Solución**: Inspeccionar HTML del sitio y actualizar selectores en configuración

## TODO / Mejoras Futuras

- [ ] Implementar autenticación admin para scrape-all
- [ ] Migrar cache a Redis para mejor performance
- [ ] Agregar análisis de sentimiento automático
- [ ] Implementar detección de duplicados
- [ ] Webhooks para notificar nuevas noticias
- [ ] Dashboard admin para monitoreo en tiempo real
- [ ] Exportar datos a CSV/JSON
- [ ] Integración con sistema de alertas
- [ ] Soporte para sitios con JavaScript rendering (Puppeteer)
- [ ] Machine learning para extracción automática de selectores

## Contacto

Para problemas o sugerencias, contactar al equipo de backend de Reputación Online.
