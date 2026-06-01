# Módulo Admin — Brief para la App Flutter

## Contexto general

El módulo admin es exclusivo para el rol `admin`. Todos los endpoints viven bajo `/api/v1/admin` y requieren un JWT con `role: "admin"`. Cualquier request sin token o con rol incorrecto recibe `401` o `403`.

### Login del admin

```http
POST /api/v1/auth/login

Body:
{
  "username": "admin",
  "password": "admin123"
}

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "user_admin",
      "name": "Administrador",
      "email": "admin@wattnbeaber.com",
      "role": "admin"
    }
  }
}
```

> El admin NO está en la base de datos — tiene ID fijo `user_admin`. Su perfil no se puede editar.

---

## Base URL

```
Producción:  https://wattnbeaver-api.wattnbeaver.site/api/v1
Local:       http://localhost:3000/api/v1
```

### Header requerido en todos los endpoints admin

```dart
headers: {
  'Authorization': 'Bearer $token',
  'Content-Type': 'application/json',
}
```

---

## Endpoints

### 1. Listar todos los usuarios

```http
GET /admin/users
```

Response incluye días de inactividad y datos de gamificación. La lista viene **ordenada de mayor a menor inactividad** (los más inactivos primero).

```json
{
  "success": true,
  "data": {
    "total": 12,
    "users": [
      {
        "id": "f17fcf1b-...",
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "role": "user",
        "avatar": null,
        "created_at": "2026-01-15T00:07:28.175Z",
        "total_points": 0,
        "current_level": 1,
        "current_streak": 0,
        "last_activity_date": null,
        "days_inactive": 136
      }
    ]
  }
}
```

**Campos clave:**

| Campo | Descripción |
|-------|-------------|
| `days_inactive` | Días enteros sin actividad IoT. Si `last_activity_date` es `null`, se cuenta desde `created_at` |
| `last_activity_date` | Última vez que el sistema de gamificación registró actividad del usuario |
| `total_points` | Puntos acumulados de gamificación |
| `current_streak` | Racha activa actual (días consecutivos) |

---

### 2. Ver un usuario específico

```http
GET /admin/users/:id
```

Misma estructura que un elemento de la lista anterior, dentro de `data.user`.

---

### 3. Crear usuario admin

```http
POST /admin/users

Body:
{
  "name": "Nombre Apellido",
  "email": "nuevo@admin.com",
  "password": "MinPass1"
}

Response 201:
{
  "success": true,
  "message": "Usuario admin creado exitosamente",
  "data": {
    "user": {
      "id": "uuid-nuevo",
      "name": "Nombre Apellido",
      "email": "nuevo@admin.com",
      "role": "admin",
      ...
    }
  }
}
```

Validaciones del backend:
- Contraseña: mínimo 8 caracteres, al menos una letra y un número
- Email no puede estar duplicado → `409`
- Siempre crea con `role: "admin"`

---

### 4. Editar usuario

**Ruta nativa (puede ser bloqueada por Cloudflare):**
```http
PUT /admin/users/:id
```

**Ruta alternativa via POST (funciona siempre con Cloudflare):**
```http
POST /admin/users/:id/update
```

```json
Body (todos opcionales):
{
  "name": "Nuevo nombre",
  "email": "nuevo@email.com",
  "role": "user"
}
```

Restricciones:
- El admin no puede cambiar su propio rol → `403`
- `role` solo acepta `"user"` o `"admin"`

---

### 5. Eliminar usuario

**Ruta nativa (puede ser bloqueada por Cloudflare):**
```http
DELETE /admin/users/:id
```

**Ruta alternativa via POST (funciona siempre con Cloudflare):**
```http
POST /admin/users/:id/delete
```

No lleva body.

**Respuestas posibles:**

| Código | Mensaje | Motivo |
|--------|---------|--------|
| `200` | `"Usuario eliminado"` | OK |
| `403` | `"No puedes eliminarte a ti mismo"` | El admin intenta borrarse |
| `403` | `"No se puede eliminar: el usuario lleva N día(s) de inactividad. Se requieren mínimo 5."` | Menos de 5 días inactivo |
| `404` | `"Usuario no encontrado"` | ID inexistente |

> **Regla de negocio:** solo se pueden eliminar usuarios con **5 o más días de inactividad**. El campo `days_inactive` de la lista sirve para saber de antemano si un usuario es eliminable.

---

### 6. Estadísticas del sistema

```http
GET /admin/stats
```

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_users": 12,
      "total_devices": 5,
      "total_energy_readings": 48230,
      "total_water_readings": 31540,
      "total_alerts": 87,
      "total_points_awarded": 3250,
      "avg_points_per_user": 270.83,
      "active_streaks": 2
    }
  }
}
```

---

### 7. Salud del servidor

```http
GET /admin/server
```

```json
{
  "success": true,
  "data": {
    "memory": {
      "total_mb": 4096.0,
      "used_mb": 1638.4,
      "free_mb": 1126.4,
      "usage_percent": 40.0
    },
    "cpu": {
      "temp_celsius": 58.7,
      "cores": 4,
      "model": "Cortex-A76",
      "load_avg_1m": 0.45,
      "load_avg_5m": 0.38,
      "load_avg_15m": 0.31,
      "load_percent_1m": 11.3
    },
    "disk": {
      "/": {
        "total_gb": 917.0,
        "used_gb": 14.0,
        "free_gb": 866.0,
        "usage_percent": 2.0
      },
      "/boot/firmware": {
        "total_gb": 0.5,
        "used_gb": 0.1,
        "free_gb": 0.4,
        "usage_percent": 13.0
      }
    },
    "uptime_seconds": 86400,
    "platform": "linux",
    "arch": "arm64",
    "node_version": "v20.20.0"
  }
}
```

---

## Notas de implementación Flutter

### Workaround Cloudflare (importante)

Cloudflare WAF bloquea `DELETE` y `PUT` en el tunnel. Usar siempre las rutas POST alternativas:

```dart
// Eliminar usuario
await http.post(
  Uri.parse('$baseUrl/admin/users/$userId/delete'),
  headers: authHeaders,
);

// Editar usuario
await http.post(
  Uri.parse('$baseUrl/admin/users/$userId/update'),
  headers: authHeaders,
  body: jsonEncode({'name': nuevoNombre, 'role': nuevoRol}),
);
```

### Lógica recomendada para el botón "Eliminar"

1. Leer `days_inactive` del usuario desde `GET /admin/users`
2. Si `days_inactive < 5` → mostrar el botón deshabilitado o un tooltip con los días restantes
3. Si `days_inactive >= 5` → habilitar el botón de eliminar
4. Hacer `POST /admin/users/:id/delete`

```dart
bool canDelete(int daysInactive) => daysInactive >= 5;

String deleteHint(int daysInactive) =>
  canDelete(daysInactive)
    ? 'Eliminar usuario'
    : 'Disponible en ${5 - daysInactive} día(s) más';
```
