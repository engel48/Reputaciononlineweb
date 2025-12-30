#!/bin/bash
#
# Script para ejecutar el cron de scraping de noticias
# Ejecutar desde crontab cada 5 minutos:
# */5 * * * * /path/to/scripts/run-cron.sh >> /var/log/news-cron.log 2>&1
#

# URL del endpoint (ajustar según el entorno)
CRON_URL="${CRON_URL:-http://localhost:3000/api/news-monitoring/cron}"

# Secret opcional (si está configurado en el servidor)
CRON_SECRET="${CRON_SECRET:-}"

echo "[$(date)] Ejecutando cron de scraping..."

if [ -n "$CRON_SECRET" ]; then
  curl -s -X GET "$CRON_URL" \
    -H "x-cron-secret: $CRON_SECRET" \
    -H "Content-Type: application/json"
else
  curl -s -X GET "$CRON_URL" \
    -H "Content-Type: application/json"
fi

echo ""
echo "[$(date)] Cron completado"
