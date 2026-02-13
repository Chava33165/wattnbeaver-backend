# Diccionario de Datos - WattBeaber

## Tabla: users
**Descripción**: Almacena información de usuarios registrados en el sistema.

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| id | VARCHAR(36) | NO | UUID único del usuario (PK) |
| name | VARCHAR(255) | NO | Nombre completo |
| email | VARCHAR(255) | NO | Email único para login (UNIQUE) |
| password_hash | VARCHAR(60) | NO | Hash bcrypt de la contraseña |
| role | VARCHAR(20) | NO | Rol: 'user' o 'admin' |
| avatar | VARCHAR(500) | SÍ | URL del avatar |
| created_at | TIMESTAMP | NO | Fecha de registro |
| updated_at | TIMESTAMP | NO | Última actualización |

**Índices**: email (UNIQUE)

---

## Tabla: devices
**Descripción**: Dispositivos IoT vinculados a usuarios.

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| id | VARCHAR(36) | NO | UUID interno (PK) |
| user_id | VARCHAR(36) | NO | FK a users.id |
| household_id | VARCHAR(36) | SÍ | FK a households.id (opcional) |
| device_id | VARCHAR(50) | NO | ID físico del dispositivo (UNIQUE) |
| device_name | VARCHAR(100) | NO | Nombre personalizado |
| device_type | VARCHAR(20) | NO | 'energy' o 'water' |
| location | VARCHAR(100) | SÍ | Ubicación en casa |
| status | VARCHAR(20) | NO | 'active', 'inactive', 'maintenance' |
| created_at | TIMESTAMP | NO | Fecha de vinculación |
| updated_at | TIMESTAMP | NO | Última actualización |

**Índices**: device_id (UNIQUE), user_id
**Relaciones**: user_id → users.id (ON DELETE CASCADE)

---

## Tabla: energy_readings
**Descripción**: Lecturas de consumo eléctrico en tiempo real.

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| id | INTEGER | NO | ID autoincremental (PK) |
| device_id | VARCHAR(50) | NO | FK a devices.device_id |
| user_id | VARCHAR(36) | NO | FK a users.id (desnormalizado) |
| power | REAL | NO | Potencia instantánea en Watts |
| voltage | REAL | NO | Voltaje en Volts |
| current | REAL | NO | Corriente en Amperes |
| energy | REAL | NO | Energía acumulada en kWh |
| timestamp | TIMESTAMP | NO | Momento de la lectura |

**Índices**: (device_id, timestamp), (user_id, timestamp)
**Frecuencia**: Cada 3-5 segundos
**Volumen estimado**: ~17,000 registros/día por dispositivo

---

## Tabla: water_readings
**Descripción**: Lecturas de consumo de agua.

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| id | INTEGER | NO | ID autoincremental (PK) |
| device_id | VARCHAR(50) | NO | FK a devices.device_id |
| user_id | VARCHAR(36) | NO | FK a users.id |
| flow | REAL | NO | Flujo en litros/minuto |
| total | REAL | NO | Total acumulado en litros |
| timestamp | TIMESTAMP | NO | Momento de la lectura |

**Índices**: (device_id, timestamp), (user_id, timestamp)

---

## Tabla: alerts
**Descripción**: Sistema de alertas automáticas.

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| id | VARCHAR(36) | NO | UUID (PK) |
| user_id | VARCHAR(36) | NO | FK a users.id |
| device_id | VARCHAR(50) | SÍ | FK a devices.device_id |
| type | VARCHAR(20) | NO | 'energy', 'water', 'system' |
| severity | VARCHAR(20) | NO | 'info', 'warning', 'critical' |
| message | TEXT | NO | Mensaje descriptivo |
| data | TEXT | SÍ | JSON con datos adicionales |
| acknowledged | INTEGER | NO | 0=no, 1=sí |
| acknowledged_at | TIMESTAMP | SÍ | Fecha de reconocimiento |
| resolved | INTEGER | NO | 0=no, 1=sí |
| resolved_at | TIMESTAMP | SÍ | Fecha de resolución |
| resolution | TEXT | SÍ | Descripción de la solución |
| created_at | TIMESTAMP | NO | Fecha de creación |

**Reglas de negocio**:
- Consumo > 2000W → warning
- Consumo > 3000W → critical
- Voltaje < 110V o > 135V → warning
- Flujo constante 30+ min → critical (fuga)

---

## Tabla: user_gamification
**Descripción**: Perfil de gamificación por usuario (1:1 con users).

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| user_id | VARCHAR(36) | NO | FK a users.id (PK) |
| total_points | INTEGER | NO | Puntos acumulados totales |
| current_level | INTEGER | NO | Nivel actual (1-10) |
| current_streak | INTEGER | NO | Días consecutivos activos |
| best_streak | INTEGER | NO | Mejor racha histórica |
| last_activity_date | TIMESTAMP | SÍ | Última actividad |
| created_at | TIMESTAMP | NO | Fecha de creación |
| updated_at | TIMESTAMP | NO | Última actualización |

**Cálculo de niveles**:
- Nivel 1: 0-99 puntos
- Nivel 2: 100-299 puntos
- Nivel 3: 300-599 puntos
- ... hasta Nivel 10: 4500+ puntos

---

[Continúa con las demás tablas...]
