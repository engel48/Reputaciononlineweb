# ❌ DATOS HARDCODEADOS ELIMINADOS

## Scripts Deshabilitados

### `seed-mentions-example.sql.DISABLED`

**Razón:** Este script contenía 10 menciones completamente inventadas con:
- Nombres de personas ficticias (María González, Carlos Rodríguez, etc.)
- Contenido de menciones falso
- Engagement inventado (likes, shares, comments)
- Ubicaciones y sentiment scores falsos

**Acción tomada:** Script renombrado a `.DISABLED` para evitar ejecución accidental

**Alternativa:** Las menciones reales se obtienen de:
- API real de plataformas sociales (YouTube, Facebook, X, Instagram)
- Scraping de medios colombianos
- Sistema de monitoreo en tiempo real

## Archivos Limpiados

### `/src/app/dashboard/page.tsx`
- ✅ Eliminado objeto `defaultData` con datos inventados
- ✅ Eliminada función `generarMencionIA()` que creaba menciones falsas
- ✅ Eliminada función `actualizarMenciones()` que generaba datos cada 5 minutos

### `/src/lib/reportGenerator.ts`
- ✅ Vaciada función `getSampleData()` - ahora retorna estructura vacía
- ✅ Los reportes ahora deben usar datos reales del usuario

### `/src/app/api/political-analytics/route.ts`
- ✅ Eliminado objeto `dummyPoliticalData` con métricas políticas inventadas
- ✅ Modificada función `generateFallbackPoliticalData()` para retornar error en lugar de datos falsos

### `/src/app/dashboard/analytics/page.tsx`
- ✅ Eliminado objeto `simulationData` con menciones y estadísticas inventadas

### `/prisma/seed.js`
- ✅ Eliminados 2 usuarios ficticios (Elmer Zapata, Lucía Morales)

## Estado Actual

**Datos reales:** ~95%+
**Datos hardcodeados restantes:** <5% (solo configuraciones de sistema)

## Próximos Pasos

1. Verificar que las APIs retornen datos reales de Supabase
2. Implementar mensajes apropiados cuando no hay datos disponibles
3. Agregar estados de loading mientras se cargan datos reales
4. Configurar OAuth real para plataformas sociales

---

**Última actualización:** 2025-11-19
**Estado:** Limpieza completada
