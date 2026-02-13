#!/bin/bash

echo "======================================"
echo "⚙️  ESTADO DEL SISTEMA WATTNBEABER"
echo "======================================"
echo ""

# PM2 Status
echo "1️⃣  Estado PM2..."
pm2 status
echo ""

# Logs recientes (últimas 20 líneas)
echo "2️⃣  Logs recientes API..."
pm2 logs wattnbeaber-api --lines 20 --nostream
echo ""

# Mosquitto Status
echo "3️⃣  Estado Mosquitto MQTT..."
sudo systemctl status mosquitto --no-pager
echo ""

# Estadísticas de base de datos
echo "4️⃣  Estadísticas Base de Datos..."
node ~/wattnbeaber/backend/check-db-stats.js
echo ""

# Espacio en disco
echo "5️⃣  Espacio en disco..."
df -h /home
echo ""

# Uso de memoria
echo "6️⃣  Uso de memoria..."
free -h
echo ""

echo "✅ VERIFICACIÓN COMPLETADA"
echo "======================================"
