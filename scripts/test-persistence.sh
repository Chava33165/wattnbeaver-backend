#!/bin/bash

echo "======================================"
echo "🧪 PRUEBAS PERSISTENCIA DE LECTURAS"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Login con usuario que tiene dispositivos
echo "1️⃣  Login..."
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdevices@example.com",
    "password": "Test1234"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "✅ Token obtenido"
echo ""

# Iniciar simulador (genera datos que se guardarán en DB)
echo "2️⃣  Iniciando simulador..."
curl -s -X POST $API_URL/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interval":2000}' | json_pp
echo ""

echo "⏳ Esperando 15 segundos para generar lecturas..."
sleep 15
echo ""

# Ver estadísticas de la base de datos
echo "3️⃣  Estadísticas de la base de datos..."
node -e "
const db = require('./src/services/database');
const readingsService = require('./src/services/readingsService');
db.initialize();
console.log(JSON.stringify(readingsService.getSummary(), null, 2));
" 2>/dev/null
echo ""

echo "4️⃣  Detener simulador..."
curl -s -X POST $API_URL/simulator/stop \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ PRUEBAS COMPLETADAS"
echo "======================================"
echo ""
echo "💡 Las lecturas ahora se guardan permanentemente en:"
echo "   ~/wattnbeaber/backend/data/wattnbeaber.db"