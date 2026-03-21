# API Endpoints Reference

## 🌐 Base URL

```
Development:  http://localhost:3000/api/v1
Production:   https://api.wattnbeaber.com/api/v1  (cuando esté disponible)
```

## 🔑 Autenticación

Todos los endpoints (excepto auth) requieren JWT token:

```dart
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json'
}
```

---

## 📋 Índice de Endpoints

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Dispositivos](#dispositivos)
4. [Energía](#energía)
5. [Agua](#agua)
6. [Alertas](#alertas)
7. [Gamificación](#gamificación)
8. [Notificaciones](#notificaciones)
9. [Reportes](#reportes)

---

## 🔐 Autenticación

### Registro
```http
POST /auth/register

Body:
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!"
}

Response 201:
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-123",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user"
    }
  }
}
```

### Login
```http
POST /auth/login

Body:
{
  "email": "juan@example.com",
  "password": "Password123!"
}

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-123",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user"
    }
  }
}

Error 401:
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

### Verificar Token
```http
GET /auth/me
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

---

## 👤 Usuarios

### Obtener Perfil
```http
GET /auth/me
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "avatar": null,
    "role": "user",
    "created_at": "2026-02-01T00:00:00Z"
  }
}
```

### Actualizar Perfil
```http
PUT /auth/me
Headers: Authorization: Bearer {token}

Body:
{
  "name": "Juan Pérez García",
  "avatar": "https://..."
}

Response 200:
{
  "success": true,
  "message": "Perfil actualizado",
  "data": { /* usuario actualizado */ }
}
```

---

## 📱 Dispositivos

### Listar Dispositivos
```http
GET /devices
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "dev-123",
      "device_id": "WB_ENERGY_001",
      "device_name": "Refrigerador",
      "device_type": "energy",
      "location": "Cocina",
      "status": "active",
      "created_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

### Obtener Dispositivo por ID
```http
GET /devices/{id}
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "dev-123",
    "device_id": "WB_ENERGY_001",
    "device_name": "Refrigerador",
    "device_type": "energy",
    "location": "Cocina",
    "status": "active",
    "current_reading": {
      "power": 145.5,
      "voltage": 220,
      "current": 0.66,
      "timestamp": "2026-02-14T23:00:00Z"
    }
  }
}
```

### Crear Dispositivo
```http
POST /devices
Headers: Authorization: Bearer {token}

Body:
{
  "device_id": "WB_ENERGY_002",
  "device_name": "Lavadora",
  "device_type": "energy",
  "location": "Lavandería"
}

Response 201:
{
  "success": true,
  "message": "Dispositivo creado",
  "data": { /* dispositivo creado */ }
}
```

### Actualizar Dispositivo
```http
PUT /devices/{id}
Headers: Authorization: Bearer {token}

Body:
{
  "device_name": "Lavadora Samsung",
  "location": "Cuarto de lavado"
}

Response 200:
{
  "success": true,
  "message": "Dispositivo actualizado"
}
```

### Eliminar Dispositivo
```http
DELETE /devices/{id}
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Dispositivo eliminado"
}
```

---

## ⚡ Energía

### Resumen de Hoy
```http
GET /energy/summary/today
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "total_kwh": 45.2,
    "avg_power": 1883.3,
    "peak_power": 3500,
    "change_percent": -12.5,
    "readings_count": 288
  }
}
```

### Resumen Semanal
```http
GET /energy/summary/week
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "days": [
      {
        "date": "2026-02-08",
        "total_kwh": 42.3,
        "avg_power": 1762.5
      },
      {
        "date": "2026-02-09",
        "total_kwh": 45.1,
        "avg_power": 1879.2
      }
      // ... 7 días
    ],
    "week_total": 310.5,
    "week_avg": 44.36
  }
}
```

### Lecturas por Dispositivo
```http
GET /energy/readings/{device_id}?period=day&limit=100
Headers: Authorization: Bearer {token}

Query Params:
- period: hour | day | week | month
- limit: número de registros (default: 100)

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1234,
      "power": 145.5,
      "voltage": 220,
      "current": 0.66,
      "energy": 0.145,
      "timestamp": "2026-02-14T23:00:00Z"
    }
  ]
}
```

---

## 💧 Agua

### Resumen de Hoy
```http
GET /water/summary/today
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "total_liters": 230,
    "avg_flow": 9.58,
    "peak_flow": 25,
    "change_percent": 5.2,
    "readings_count": 288
  }
}
```

### Resumen Semanal
```http
GET /water/summary/week
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "days": [
      {
        "date": "2026-02-08",
        "total_liters": 220
      },
      {
        "date": "2026-02-09",
        "total_liters": 235
      }
      // ... 7 días
    ],
    "week_total": 1610,
    "week_avg": 230
  }
}
```

---

## 🚨 Alertas

### Listar Alertas
```http
GET /alerts?acknowledged=false&limit=10
Headers: Authorization: Bearer {token}

Query Params:
- acknowledged: true | false
- limit: número de alertas

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "alert-123",
      "type": "high_consumption",
      "severity": "warning",
      "message": "Consumo alto detectado en Refrigerador",
      "data": {
        "device_id": "WB_ENERGY_001",
        "current_power": 350,
        "threshold": 250
      },
      "acknowledged": false,
      "created_at": "2026-02-14T22:00:00Z"
    }
  ]
}
```

### Reconocer Alerta
```http
POST /alerts/{id}/acknowledge
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Alerta reconocida"
}
```

---

## 🏆 Gamificación

### Obtener Datos del Usuario
```http
GET /gamification/me
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "user_id": "uuid-123",
    "total_points": 1250,
    "current_level": 5,
    "current_streak": 12,
    "best_streak": 30,
    "last_activity_date": "2026-02-14"
  }
}
```

### Logros del Usuario
```http
GET /gamification/achievements
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "ach_first_week",
      "name": "Primera Semana",
      "description": "Completa tu primera semana usando WattBeaber",
      "icon": "🎉",
      "points": 100,
      "category": "milestone",
      "completed": true,
      "completed_at": "2026-02-05T12:00:00Z",
      "progress": 100
    }
  ]
}
```

### Retos Activos
```http
GET /gamification/challenges/active
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uc-456",
      "challenge_id": "chal_reduce_15",
      "name": "Reduce 15% esta semana",
      "type": "energy_reduction",
      "current_value": 6.75,
      "target_value": 15,
      "reward_points": 200,
      "status": "active",
      "start_date": "2026-02-10",
      "end_date": "2026-02-17",
      "days_remaining": 3
    }
  ]
}
```

### Leaderboard
```http
GET /gamification/leaderboard?period=week
Headers: Authorization: Bearer {token}

Query Params:
- period: week | month | all

Response 200:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "user-456",
        "name": "María García",
        "level": 12,
        "points": 5420,
        "streak": 45
      }
    ],
    "user_rank": {
      "rank": 8,
      "points": 1250
    },
    "total_users": 120
  }
}
```

---

## 🔔 Notificaciones

### Listar Notificaciones
```http
GET /notifications?read=false&limit=20
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "type": "achievement_unlocked",
      "title": "¡Logro Desbloqueado!",
      "message": "Has completado 'Primera Semana'",
      "icon": "🎉",
      "read": false,
      "created_at": "2026-02-14T20:00:00Z"
    }
  ]
}
```

### Marcar como Leída
```http
PUT /notifications/{id}/read
Headers: Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

## 📊 Health Check

```http
GET /health

Response 200:
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2026-02-14T23:00:00Z",
  "uptime": 79200
}
```

---

## ⚠️ Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detalles adicionales"
  }
}
```

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Bad Request (datos inválidos) |
| 401 | No autenticado |
| 403 | No autorizado |
| 404 | No encontrado |
| 500 | Error del servidor |

---

## 📝 Notas de Implementación

1. **Rate Limiting**: 100 requests/minuto por IP
2. **Token Expiry**: 24 horas
3. **Paginación**: Usar `?page=1&limit=20` donde aplique
4. **Timestamps**: Formato ISO 8601 UTC
5. **CORS**: Habilitado para todos los orígenes en desarrollo

