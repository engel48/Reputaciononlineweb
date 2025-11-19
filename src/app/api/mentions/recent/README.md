# API Endpoint: Recent Mentions

## Descripción
Endpoint para obtener menciones REALES en tiempo real desde Supabase para el dashboard.

## Endpoint
```
GET /api/mentions/recent
```

## Autenticación
Requiere token JWT en cookie `auth-token`. El endpoint valida automáticamente el usuario autenticado.

## Parámetros de Query (Opcionales)

| Parámetro | Tipo | Default | Max | Descripción |
|-----------|------|---------|-----|-------------|
| `limit` | number | 10 | 50 | Número de menciones a retornar |
| `hours` | number | 24 | - | Horas hacia atrás desde ahora |
| `platform` | string | - | - | Filtrar por plataforma específica (x, facebook, instagram, youtube, etc.) |

## Ejemplo de Uso

### 1. Fetch básico
```typescript
const response = await fetch('/api/mentions/recent');
const { success, data } = await response.json();

if (success) {
  console.log(data.mentions); // Array de menciones
  console.log(data.total);    // Total de menciones
  console.log(data.timeRange); // "24 horas"
}
```

### 2. Con parámetros personalizados
```typescript
const params = new URLSearchParams({
  limit: '20',
  hours: '48',
  platform: 'youtube'
});

const response = await fetch(`/api/mentions/recent?${params}`);
const { success, data } = await response.json();
```

### 3. Integración en el Dashboard (Reemplazo de datos hardcodeados)

En `/src/app/dashboard/page.tsx`, reemplazar el estado hardcodeado de `mencionesRecientes`:

```typescript
// ANTES (hardcodeado):
const [mencionesRecientes, setMencionesRecientes] = useState<Mention[]>([
  {
    id: '1',
    author: '@usuario123',
    platform: 'x',
    content: '¡Excelente servicio...',
    // ... más datos hardcodeados
  }
]);

// DESPUÉS (datos reales):
const [mencionesRecientes, setMencionesRecientes] = useState<Mention[]>([]);
const [loadingMenciones, setLoadingMenciones] = useState(true);

// Función para cargar menciones reales
const cargarMencionesReales = useCallback(async () => {
  try {
    setLoadingMenciones(true);

    const response = await fetch('/api/mentions/recent?limit=10&hours=24');
    const { success, data } = await response.json();

    if (success) {
      setMencionesRecientes(data.mentions);
      setUltimaActualizacion(new Date(data.lastUpdated));
      setErrorConexion(false);
    } else {
      console.error('Error cargando menciones:', data.message);
      setErrorConexion(true);
    }
  } catch (error) {
    console.error('Error en API de menciones:', error);
    setErrorConexion(true);
  } finally {
    setLoadingMenciones(false);
  }
}, []);

// Cargar al montar el componente
useEffect(() => {
  cargarMencionesReales();
}, [cargarMencionesReales]);

// Actualizar cada 5 minutos
useEffect(() => {
  if (!intervaloActivo) return;

  const interval = setInterval(() => {
    cargarMencionesReales();
  }, 5 * 60 * 1000); // 5 minutos

  return () => clearInterval(interval);
}, [cargarMencionesReales, intervaloActivo]);
```

## Formato de Respuesta

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "mentions": [
      {
        "id": "uuid-mention-id",
        "author": "María González",
        "platform": "youtube",
        "content": "Excelente contenido, muy informativo y bien explicado",
        "sentiment": "positive",
        "timestamp": "2025-01-19T10:30:00.000Z",
        "engagement": {
          "likes": 125,
          "comments": 15,
          "shares": 8
        },
        "location": "Bogotá, Colombia",
        "verified": false
      }
    ],
    "total": 10,
    "timeRange": "24 horas",
    "lastUpdated": "2025-01-19T12:00:00.000Z"
  }
}
```

### Error 401 (No autenticado)
```json
{
  "success": false,
  "message": "No autenticado. Token no encontrado."
}
```

### Error 500 (Error de servidor)
```json
{
  "success": false,
  "message": "Error interno del servidor."
}
```

## Interfaz Mention

La interfaz `Mention` devuelta por el endpoint es compatible con la existente en el frontend:

```typescript
interface Mention {
  id: string;
  author: string;         // author_name o author_username de Supabase
  platform: string;       // 'youtube', 'facebook', 'x', 'instagram', etc.
  content: string;        // Contenido de la mención
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;        // published_at de Supabase
  engagement: {
    likes: number;
    comments: number;
    retweets?: number;    // Solo para X/Twitter
    shares?: number;
  };
  location: string;       // metadata.location o "Desconocido"
  verified: boolean;      // metadata.verified
}
```

## Mapeo desde Supabase

El endpoint mapea automáticamente los campos de la tabla `mentions` en Supabase:

| Campo Supabase | Campo API | Notas |
|----------------|-----------|-------|
| `id` | `id` | UUID de la mención |
| `author_name` / `author_username` | `author` | Se prioriza author_name |
| `platform` | `platform` | Sin cambios |
| `content` | `content` | Texto de la mención |
| `metadata.sentiment` | `sentiment` | Conversión automática a 'positive'/'negative'/'neutral' |
| `published_at` | `timestamp` | Fecha de publicación |
| `likes` | `engagement.likes` | Número de likes |
| `comments` | `engagement.comments` | Número de comentarios |
| `shares` | `engagement.shares` / `engagement.retweets` | Retweets si platform='x' |
| `metadata.location` | `location` | Default: "Desconocido" |
| `metadata.verified` | `verified` | Default: false |

## Conversión de Sentiment

El endpoint convierte automáticamente diferentes formatos de sentiment:

- **String**: 'positive', 'negative', 'neutral' → se retorna directamente
- **Number** (score):
  - `> 0.3` → 'positive'
  - `< -0.3` → 'negative'
  - Entre -0.3 y 0.3 → 'neutral'
- **Sin metadata**: Default → 'neutral'

## Seguridad

- Autenticación JWT obligatoria
- Filtrado automático por `user_id` del usuario autenticado
- Límite máximo de 50 menciones por request
- Validación de parámetros de entrada

## Logs del Servidor

El endpoint registra logs útiles para debugging:

```
✅ API MENTIONS: Usuario autenticado: uuid-user-id
🔍 API MENTIONS: Parámetros de búsqueda: { limit: 10, hours: 24 }
✅ API MENTIONS: 10 menciones obtenidas exitosamente
```

## Notas de Implementación

1. El endpoint usa `supabase-server` con Service Role Key para bypass de RLS
2. Las consultas filtran automáticamente por `user_id` para seguridad
3. El ordenamiento es por `published_at` descendente (más recientes primero)
4. Si no hay menciones, retorna array vacío (no error)
5. Compatible con FORCE_SQLITE=false (producción con Supabase)

## Testing

### Verificar compilación
```bash
npm run build
```

### Probar endpoint localmente
1. Iniciar sesión en el dashboard para obtener cookie `auth-token`
2. Abrir DevTools → Network
3. Hacer fetch manual:
```javascript
fetch('/api/mentions/recent?limit=5&hours=48')
  .then(r => r.json())
  .then(console.log)
```

## Próximos Pasos

Para integrar completamente en el dashboard:

1. Reemplazar datos hardcodeados en `/src/app/dashboard/page.tsx` líneas 139-149
2. Agregar estado de loading mientras cargan las menciones
3. Implementar actualización automática (polling cada 5 minutos)
4. Agregar manejo de errores con fallback a datos simulados
5. Considerar WebSocket/Supabase Realtime para actualizaciones instantáneas
