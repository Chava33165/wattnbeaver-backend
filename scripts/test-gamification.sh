#!/bin/bash

echo "======================================"
echo "🎮 PRUEBAS SISTEMA DE GAMIFICACIÓN"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Login
echo "1️⃣  Login..."
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdevices@example.com",
    "password": "Test1234"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "✅ Token obtenido"
echo ""

# Ver perfil de gamificación
echo "2️⃣  Perfil de gamificación..."
curl -s $API_URL/gamification/profile \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Ver logros
echo "3️⃣  Logros disponibles..."
curl -s $API_URL/gamification/achievements \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Ver retos
echo "4️⃣  Retos..."
curl -s $API_URL/gamification/challenges \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Iniciar un reto
echo "5️⃣  Iniciando reto..."
curl -s -X POST $API_URL/gamification/challenges/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"challenge_id":"chal_reduce_15"}' | json_pp
echo ""

# Ver leaderboard
echo "6️⃣  Leaderboard (Top 5)..."
curl -s "$API_URL/gamification/leaderboard?limit=5" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Estadísticas generales
echo "7️⃣  Estadísticas generales..."
curl -s $API_URL/gamification/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ PRUEBAS COMPLETADAS"
echo "======================================"
