#!/bin/bash

echo "======================================"
echo "🧪 PRUEBAS AUTENTICACIÓN MULTI-USUARIO"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Test 1: Registro de nuevo usuario
echo "1️⃣  Registrando nuevo usuario: Juan Pérez"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123"
  }')

echo "$REGISTER_RESPONSE" | json_pp
echo ""

# Extraer token
TOKEN_JUAN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN_JUAN" ]; then
  echo "❌ Error: No se pudo registrar usuario"
  exit 1
fi

echo "✅ Usuario registrado. Token obtenido."
echo ""

# Test 2: Intentar registrar el mismo email (debe fallar)
echo "2️⃣  Intentando registrar el mismo email (debe fallar)..."
curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Duplicado",
    "email": "juan@example.com",
    "password": "OtraPassword123"
  }' | json_pp
echo ""

# Test 3: Login con el usuario creado
echo "3️⃣  Login con usuario Juan..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "Password123"
  }')

echo "$LOGIN_RESPONSE" | json_pp
echo ""

# Test 4: Ver perfil con token
echo "4️⃣  Obteniendo perfil de Juan..."
curl -s $API_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN_JUAN" | json_pp
echo ""

# Test 5: Registrar segundo usuario
echo "5️⃣  Registrando segundo usuario: María García"
REGISTER_RESPONSE2=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@example.com",
    "password": "SecurePass456"
  }')

echo "$REGISTER_RESPONSE2" | json_pp
echo ""

TOKEN_MARIA=$(echo "$REGISTER_RESPONSE2" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test 6: Login con admin (debe seguir funcionando)
echo "6️⃣  Login con admin (retrocompatibilidad)..."
ADMIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "$ADMIN_RESPONSE" | json_pp
TOKEN_ADMIN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""

# Test 7: Listar usuarios (solo admin)
echo "7️⃣  Listar todos los usuarios (admin only)..."
curl -s $API_URL/auth/users \
  -H "Authorization: Bearer $TOKEN_ADMIN" | json_pp
echo ""

# Test 8: Intentar listar usuarios sin ser admin (debe fallar)
echo "8️⃣  Intentando listar usuarios con usuario normal (debe fallar)..."
curl -s $API_URL/auth/users \
  -H "Authorization: Bearer $TOKEN_JUAN" | json_pp
echo ""

# Test 9: Login con credenciales incorrectas
echo "9️⃣  Login con contraseña incorrecta (debe fallar)..."
curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "PasswordIncorrecta"
  }' | json_pp
echo ""

# Test 10: Acceder sin token
echo "🔟 Intentar acceder a perfil sin token (debe fallar)..."
curl -s $API_URL/auth/profile | json_pp
echo ""

echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "======================================"
echo ""
echo "📊 Resumen:"
echo "  - Usuario Juan: juan@example.com"
echo "  - Usuario María: maria@example.com"
echo "  - Admin: admin / admin123"
echo ""
echo "🔑 Tokens guardados:"
echo "  TOKEN_JUAN=$TOKEN_JUAN"
echo "  TOKEN_MARIA=$TOKEN_MARIA"
echo "  TOKEN_ADMIN=$TOKEN_ADMIN"
