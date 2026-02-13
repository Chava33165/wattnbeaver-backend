#!/bin/bash

echo "======================================"
echo "🧪 PRUEBAS PROCESAMIENTO - WattBeaber"
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

# Iniciar simulador
echo "2️⃣  Iniciando simulador de datos..."
curl -s -X POST $API_URL/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interval":2000}' | json_pp
echo ""

echo "⏳ Esperando 15 segundos para generar datos..."
sleep 15
echo ""

# Análisis de energía
echo "3️⃣  Análisis de dispositivo de energía..."
curl -s "$API_URL/energy/analysis/sonoff_01?period=24h" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Tendencias
echo "4️⃣  Tendencias de consumo..."
curl -s "$API_URL/energy/trends/sonoff_01?interval=hour" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Costo de energía
echo "5️⃣  Cálculo de costo de energía..."
curl -s "$API_URL/energy/cost/sonoff_01?period=24h&cost_per_kwh=2.5" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Análisis de agua
echo "6️⃣  Análisis de sensor de agua..."
curl -s "$API_URL/water/analysis/sensor_01?period=24h" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Detección de fugas
echo "7️⃣  Detección de fugas..."
curl -s "$API_URL/water/leaks/sensor_01" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Alertas
echo "8️⃣  Estadísticas de alertas..."
curl -s "$API_URL/alerts/stats/summary?period=24h" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Últimas alertas
echo "9️⃣  Últimas 5 alertas..."
curl -s "$API_URL/alerts?limit=5" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "======================================"
echo ""
echo "💡 Tip: El simulador sigue corriendo."
echo "   Para detenerlo:"
echo "   curl -X POST $API_URL/simulator/stop -H \"Authorization: Bearer $TOKEN\""
