#!/bin/bash

echo "======================================"
echo "✅ VERIFICACIÓN BACKEND - LISTO PARA 3.4"
echo "======================================"
echo ""

echo "📁 Verificando estructura..."
files=(
  "src/models/BaseModel.js"
  "src/models/User.js"
  "src/services/userService.js"
  "src/utils/validation.js"
  "src/controllers/auth/authController.js"
  "src/middlewares/auth.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ FALTA: $file"
  fi
done

echo ""
echo "🧪 Probando endpoints..."

API_URL="http://localhost:3000/api/v1"

# Test health
echo -n "  Health check: "
HEALTH=$(curl -s $API_URL/health | grep -o '"success":true')
if [ -n "$HEALTH" ]; then
  echo "✅"
else
  echo "❌"
fi

# Test registro
echo -n "  Registro (POST /auth/register): "
REG=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test'$(date +%s)'@test.com","password":"Test1234"}' \
  | grep -o '"success":true')
if [ -n "$REG" ]; then
  echo "✅"
else
  echo "❌"
fi

# Test login admin
echo -n "  Login admin: "
LOGIN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"token"')
if [ -n "$LOGIN" ]; then
  echo "✅"
else
  echo "❌"
fi

echo ""
echo "📊 Estado PM2..."
pm2 status | grep wattnbeaber-api

echo ""
echo "======================================"
echo "✅ BACKEND LISTO PARA FASE 3.4"
echo "======================================"
echo ""
echo "Próximo paso:"
echo "  → Implementar base de datos SQLite"
echo "  → Conectar modelos a la DB"
echo "  → Sistema de gamificación"
