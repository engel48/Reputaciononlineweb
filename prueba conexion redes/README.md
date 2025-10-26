# Reputación Online

Plataforma completa de conexión y análisis de redes sociales con datos técnicos en tiempo real.

## 🚀 Inicio Rápido

1. Abre el archivo `index.html` directamente en tu navegador
2. Selecciona una plataforma (Facebook o Instagram)
3. Observa el proceso de conexión con animaciones en tiempo real
4. Explora el dashboard con todas las métricas y datos

## 📁 Archivos Incluidos

- `index.html` - Interfaz principal de la aplicación
- `styles.css` - Estilos y animaciones profesionales
- `data-service.js` - Servicio de generación de datos realistas
- `app.js` - Lógica de la aplicación y renderizado

## ✨ Características

### Plataformas Soportadas
- **Facebook** - Análisis completo con Graph API v19.0
- **Instagram** - Monitoreo con Instagram Graph API v18.0

### Datos Generados
- 20 publicaciones con métricas completas
- 285+ puntos de datos técnicos
- Análisis de sentimiento (positivo/neutral/negativo)
- Demografía completa (edad, género, ubicación)
- Tendencias de 30 días
- Métricas técnicas de API

### Dashboard con 4 Tabs
1. **Vista General** - Métricas principales, sentimiento, tendencias
2. **Publicaciones** - 20 posts con engagement detallado
3. **Audiencia** - Demografía completa
4. **Datos Técnicos** - API info, rate limits, latency

### Animaciones
- Progress bar animado (0% → 100%)
- Contadores incrementales suaves
- Logs técnicos en tiempo real
- Círculos pulsantes durante conexión
- Transiciones suaves entre tabs
- Efectos hover profesionales

## 🎯 Flujo de Uso

```
Selector de Plataforma
    ↓
Conexión Animada (4-6 segundos)
├─ Progress: 0% → 100%
├─ Logs técnicos en tiempo real
└─ Autenticación OAuth 2.0
    ↓
Dashboard Completo
├─ 4 métricas animadas
├─ 4 tabs interactivos
└─ Botón desconectar
```

## 📊 Métricas Incluidas

### Métricas Principales
- Seguidores (100K - 1M)
- Engagement Rate (2.8% - 7.3%)
- Alcance Total (calculado)
- Crecimiento (+7% - +22%)

### Por Publicación
- Likes, Comentarios, Compartidos
- Alcance e Impresiones
- Engagement Rate calculado
- Análisis de sentimiento
- Hashtags y menciones

### Demografía
- Edades: 5 rangos (18-24, 25-34, 35-44, 45-54, 55+)
- Género: Masculino, Femenino, Otro
- Ubicaciones: 6 ciudades colombianas principales

### Datos Técnicos
- Versión de API
- ID de cuenta
- Puntos de datos recolectados
- Tiempo de respuesta (ms)
- Rate Limit actual/máximo
- Última sincronización

## 🎨 Personalización

### Cambiar Colores
Edita el archivo `styles.css`:
```css
/* Gradientes principales */
background: linear-gradient(135deg, #3b82f6, #8b5cf6);
```

### Modificar Cantidad de Posts
Edita `data-service.js`, línea ~120:
```javascript
for (let i = 0; i < 20; i++) {  // Cambiar 20 por el número deseado
    posts.push(this.generatePost(i));
}
```

### Ajustar Velocidad de Conexión
Edita `app.js`, función `simulateConnection`:
```javascript
{ progress: 15, message: '...', delay: 800 }  // Reducir delay para más velocidad
```

## 🔧 Tecnologías

- HTML5
- CSS3 (Flexbox, Grid, Animations)
- JavaScript ES6+ (Vanilla)
- Sin dependencias externas
- Completamente standalone

## 📱 Responsive

Optimizado para:
- 📱 Mobile (320px+)
- 💻 Tablet (768px+)
- 🖥️ Desktop (1024px+)

## ✅ Características Especiales

- ✅ Sin palabra "simulación" visible
- ✅ Datos 100% realistas
- ✅ Animaciones fluidas 60fps
- ✅ Sin dependencias externas
- ✅ Funciona offline
- ✅ Código limpio y comentado

## 🎯 Casos de Uso

- Demostración de plataforma de análisis
- Prototipo de dashboard de redes sociales
- Presentación a clientes
- Material educativo sobre métricas
- Base para desarrollo con API real

## 📝 Notas

- Todos los datos son generados dinámicamente
- Cada conexión crea datos únicos
- El sentimiento se asigna de forma balanceada
- Las tendencias siguen patrones realistas
- Los tiempos de respuesta son aleatorios (100-500ms)

## 🚀 Mejoras Futuras

Puedes agregar:
- Exportación de datos a CSV/PDF
- Gráficos con Chart.js o D3.js
- Filtros por fecha
- Comparación entre plataformas
- Modo oscuro/claro
- Múltiples cuentas

---

**Reputación Online - Plataforma Profesional de Análisis de Redes Sociales**
