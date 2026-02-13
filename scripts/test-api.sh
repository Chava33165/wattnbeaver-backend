#!/bin/bash

echo "======================================"
echo "🧪 PRUEBAS API - WattBeaber"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

echo "1️⃣  Health Check..."
curl -s $API_URL/health | json_pp
echo ""

echo "2️⃣  Login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "$LOGIN_RESPONSE" | json_pp
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

echo "3️⃣  Obtener dispositivos de energía..."
curl -s $API_URL/energy/devices \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "4️⃣  Obtener consumo total..."
curl -s $API_URL/energy/total \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "5️⃣  Obtener sensores de agua..."
curl -s $API_URL/water/sensors \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "======================================"
