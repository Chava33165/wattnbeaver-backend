#!/bin/bash

echo "======================================"
echo "🧪 PRUEBAS INTEGRACIÓN MQTT - WattBeaber"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Login
echo "1️⃣  Obteniendo token..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# Ver estadísticas MQTT
echo "2️⃣  Estadísticas de MQTT..."
curl -s $API_URL/mqtt/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Iniciar simulador
echo "3️⃣  Iniciando simulador (esto generará mensajes MQTT)..."
curl -s -X POST $API_URL/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interval":2000}' | json_pp
echo ""

echo "⏳ Esperando 10 segundos para generar mensajes MQTT..."
sleep 10
echo ""

# Ver estadísticas MQTT actualizadas
echo "4️⃣  Estadísticas de MQTT actualizadas..."
curl -s $API_URL/mqtt/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Publicar mensaje manual
echo "5️⃣  Publicando mensaje de prueba en MQTT..."
curl -s -X POST $API_URL/mqtt/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "wattnbeaber/system/test",
    "message": {"test": "mensaje de prueba", "timestamp": "'$(date -Iseconds)'"},
    "qos": 1,
    "retain": false
  }' | json_pp
echo ""

# Enviar comando a dispositivo
echo "6️⃣  Enviando comando ON a sonoff_01..."
curl -s -X POST $API_URL/energy/devices/sonoff_01/control \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"on"}' | json_pp
echo ""

# Ver datos procesados
echo "7️⃣  Datos procesados de energía..."
curl -s "$API_URL/energy/analysis/sonoff_01?period=1h" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "8️⃣  Datos procesados de agua..."
curl -s "$API_URL/water/analysis/sensor_01?period=1h" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Alertas generadas
echo "9️⃣  Alertas generadas..."
curl -s "$API_URL/alerts?limit=5" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "======================================"
echo ""
echo "💡 Tips:"
echo "   - El simulador sigue corriendo y publicando en MQTT"
echo "   - Ver logs MQTT: pm2 logs wattnbeaber-api"
echo "   - Monitor MQTT: ~/wattnbeaber/scripts/mqtt-monitor.sh"
echo "   - Detener simulador: POST $API_URL/simulator/stop"
