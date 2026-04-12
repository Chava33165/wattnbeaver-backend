# BRIEF: Verificación de Pantalla de Energía - App Móvil WattBeaber

**Fecha:** 2026-03-24
**Contexto:** Verificar integración correcta entre la app móvil Flutter y el backend Node.js
**Usuario de prueba:** Test User (testdevices@example.com)
**Sensor de prueba:** wb_a1838a (nombre: "prueba")

---

## 📱 PANTALLA DE ENERGÍA - COMPONENTES

La pantalla de energía (`Energía`) muestra:

### 1. **POTENCIA ACTUAL**
- Título: "POTENCIA ACTUAL"
- Valor esperado: `0 W` (cuando no hay consumo activo)
- Icono: Rayo ⚡

### 2. **CONSUMO DEL PERÍODO**
- Título cambia según pestaña seleccionada:
  - `Hoy` → "CONSUMO HOY"
  - `Semana` → "CONSUMO SEMANA"
  - `Mes` → "CONSUMO MES"
- Valor esperado (para hoy): `~0.027 kWh`
- Icono: Bombilla 💡

### 3. **COSTO ESTIMADO**
- Título: "COSTO ESTIMADO"
- Tarifa: `$2.50 / kWh`
- Cálculo: `consumo_kwh × 2.50`
- Valor esperado (para hoy): `$0.07 MXN`
- Icono: Dólar $

### 4. **GRÁFICA DE CONSUMO**
- Muestra barras por período (hora/día/mes)
- Eje X: Tiempo
- Eje Y: kWh consumidos
- Estado vacío: "Sin datos históricos"

### 5. **LISTA DE SENSORES**
- Título: "SENSORES"
- Muestra dispositivos de energía del usuario
- Estados posibles:
  - `Activo` (verde) - Recibiendo datos recientes
  - `Inactivo` (gris) - Sin datos recientes
- Cada sensor muestra:
  - Icono del dispositivo
  - Nombre del dispositivo
  - Estado

---

## 🔌 ENDPOINTS DEL BACKEND (API v1)

### Base URL
```
http://localhost:3000/api/v1
```

### Autenticación
Todas las llamadas requieren:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📡 ENDPOINTS QUE LA APP DEBE USAR

### 1. **LOGIN** (obligatorio primero)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "testdevices@example.com",
  "password": "Test1234"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a4b353a5-29b3-477b-b00a-8a9537726aa7",
      "name": "Test User",
      "email": "testdevices@example.com"
    }
  }
}
```

---

### 2. **OBTENER POTENCIA ACTUAL Y CONSUMO TOTAL**
```http
GET /energy/total
Authorization: Bearer <token>
```

**Uso en la app:**
- Tarjeta "POTENCIA ACTUAL"
- Para verificar si hay dispositivos online

**Respuesta esperada (2026-03-24):**
```json
{
  "success": true,
  "data": {
    "totalPower": "0.00",      // ← Suma de potencia de dispositivos activos (últimos 5 min)
    "totalEnergy": "0.027",    // ← Consumo total del día (kWh)
    "deviceCount": 4,          // ← Total de dispositivos registrados
    "onlineDevices": 1         // ← Dispositivos con lecturas recientes
  }
}
```

**Cálculo interno:**
- `totalPower`: Suma de últimas lecturas de dispositivos activos (últimos 5 min)
- `totalEnergy`: Energía del día usando `AVG(power) × tiempo_transcurrido / 1000`

---

### 3. **OBTENER HISTORIAL DE CONSUMO (PARA GRÁFICA)**
```http
GET /energy/history?period={day|week|month}
Authorization: Bearer <token>
```

**Uso en la app:**
- Gráfica de consumo
- Tarjeta "CONSUMO HOY/SEMANA/MES"

**Parámetros:**
- `period=day` → Últimas 24 horas (agrupado por hora)
- `period=week` → Últimos 7 días (agrupado por hora)
- `period=month` → Últimos 30 días (agrupado por hora)

**Respuesta esperada (2026-03-24, period=day):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "hour": "2026-03-24T01:00:00",       // ← Bucket de tiempo
        "avg_power": 59.73,                  // ← Potencia promedio (W)
        "hours_elapsed": 0.4544,             // ← Tiempo real transcurrido (horas)
        "total_energy": 0.027143,            // ← Energía consumida (kWh) ✅ CORREGIDO
        "readings_count": 300,               // ← Número de lecturas
        "first_reading": "2026-03-23 19:16:06",
        "last_reading": "2026-03-23 19:43:22"
      }
    ]
  }
}
```

**⚠️ IMPORTANTE - CÁLCULO CORREGIDO:**
```
Energía (kWh) = Potencia promedio (W) × Horas transcurridas / 1000
```

**Antes (INCORRECTO):**
```sql
AVG(power) * 1.0 / 1000.0  -- Asumía 1 hora exacta siempre
```

**Después (CORRECTO):**
```sql
AVG(power) * (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24 / 1000.0
-- Calcula tiempo REAL transcurrido
```

---

### 4. **OBTENER LISTA DE DISPOSITIVOS**
```http
GET /energy/devices
Authorization: Bearer <token>
```

**Uso en la app:**
- Lista de "SENSORES"
- Para mostrar estado activo/inactivo

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "...",
        "device_id": "wb_a1838a",
        "device_name": "prueba",
        "device_type": "energy",
        "status": "active",
        "location": null
      },
      {
        "device_id": "sonoff_kitchen",
        "device_name": "Refrigerador Samsung",
        "device_type": "energy",
        "status": "active"
      }
    ],
    "total": 4
  }
}
```

---

### 5. **ESTADÍSTICAS SEMANALES (Opcional)**
```http
GET /energy/statistics/weekly?startDate=2026-03-17&endDate=2026-03-23
Authorization: Bearer <token>
```

**Uso en la app:**
- Pantalla de estadísticas detalladas (si existe)

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "fecha": "2026-03-23",
        "dia_semana": "Domingo",
        "num_lecturas": 306,
        "potencia_promedio_w": 58.56,
        "potencia_maxima_w": 1007.68,
        "voltaje_promedio_v": 98.4,
        "corriente_promedio_a": 1.898,
        "consumo_dia_kwh": 0.0271,
        "horas_transcurridas": 0.46
      }
    ],
    "totalDays": 1
  }
}
```

---

## 🎯 VERIFICACIÓN - CHECKLIST

### ✅ **ENDPOINTS CORRECTOS**
- [ ] La app usa `/energy/total` para potencia actual
- [ ] La app usa `/energy/history?period=day` para "Consumo Hoy"
- [ ] La app usa `/energy/history?period=week` para "Consumo Semana"
- [ ] La app usa `/energy/history?period=month` para "Consumo Mes"
- [ ] La app usa `/energy/devices` para lista de sensores

### ✅ **CÁLCULOS CORRECTOS**
- [ ] "CONSUMO HOY" muestra ~0.027 kWh (no 0.1 kWh)
- [ ] "COSTO ESTIMADO" muestra ~$0.07 (no $0.27)
- [ ] La gráfica suma correctamente los `total_energy` de cada bucket
- [ ] Los sensores muestran estado "Activo" si `onlineDevices > 0`

### ✅ **FLUJO DE DATOS**
- [ ] La app hace login y guarda el token JWT
- [ ] Todas las llamadas incluyen `Authorization: Bearer <token>`
- [ ] La app refresca datos al cambiar de pestaña (Hoy/Semana/Mes)
- [ ] La app maneja errores 401 (token expirado) y redirige a login

---

## 🐛 PROBLEMA DETECTADO (SOLUCIONADO)

### Antes de la corrección:
- App mostraba: **0.1 kWh** y **$0.27 MXN**
- Backend devolvía: `total_energy: 0.084` (incorrecto)
- Causa: El endpoint asumía que cada bucket duraba exactamente 1 hora

### Después de la corrección:
- App debe mostrar: **0.027 kWh** y **$0.07 MXN**
- Backend ahora devuelve: `total_energy: 0.027143` (correcto)
- Solución: Calcula tiempo real con `julianday(MAX) - julianday(MIN)`

---

## 📊 DATOS DE PRUEBA (Sensor wb_a1838a)

### Usuario Test
```
Email: testdevices@example.com
Password: Test1234
ID: a4b353a5-29b3-477b-b00a-8a9537726aa7
```

### Sensor de Prueba
```
device_id: wb_a1838a
device_name: prueba
device_type: energy
```

### Datos del día (2026-03-23)
```
Total lecturas: 306
Período: 19:16:06 → 19:43:53
Tiempo: 0.4631 horas (27.79 minutos)
Potencia promedio: 58.56 W
Potencia máxima: 1,007.68 W
Consumo REAL: 0.027115 kWh
Costo: $0.068 MXN
```

### Actividad detectada:
1. **19:16-19:17** - Electrodoméstico de ~1,000W (1 minuto)
2. **19:17-19:43** - Apagado (0W)

---

## 🔍 PREGUNTAS PARA VERIFICAR LA APP

### 1. ¿Qué endpoints usa la app?
```dart
// Buscar en el código Flutter:
// - EnergyService o EnergyRepository
// - Llamadas HTTP a /energy/*
```

### 2. ¿Cómo calcula el consumo total?
```dart
// Verificar si:
// a) Usa directamente el campo 'totalEnergy' de /energy/total ✅
// b) Suma los 'total_energy' de /energy/history ✅
// c) Hace cálculos propios ❌ (no debería)
```

### 3. ¿Cómo determina el estado del sensor?
```dart
// Verificar si usa:
// a) Campo 'status' de /energy/devices
// b) Campo 'onlineDevices' de /energy/total
// c) Timestamp de última lectura
```

### 4. ¿La app cachea datos?
```dart
// Verificar:
// - ¿Usa SharedPreferences/Hive para cachear?
// - ¿Los datos viejos pueden estar en caché?
// - ¿El pull-to-refresh limpia la caché?
```

---

## 🚀 COMANDOS ÚTILES PARA DEBUGGING

### Ver datos en la BD
```bash
sqlite3 /home/watt/wattnbeaber/backend/data/wattnbeaber.db "
SELECT
    COUNT(*) as lecturas,
    ROUND(AVG(power), 2) as pot_prom,
    ROUND((julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24, 4) as horas,
    ROUND((AVG(power) * (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24) / 1000.0, 6) as consumo_kwh
FROM energy_readings
WHERE device_id = 'wb_a1838a'
  AND date(timestamp) = date('now');
"
```

### Probar endpoint manualmente
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testdevices@example.com","password":"Test1234"}' \
  | jq -r '.data.token')

# 2. Obtener historial
curl -s "http://localhost:3000/api/v1/energy/history?period=day" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# 3. Obtener total
curl -s "http://localhost:3000/api/v1/energy/total" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### Ver logs del backend
```bash
pm2 logs wattnbeaber-api --lines 100
```

---

## 📝 NOTAS FINALES

### ✅ Backend está correcto (verificado 2026-03-24)
- Endpoint `/energy/history` devuelve `total_energy: 0.027143` ✅
- Endpoint `/energy/total` devuelve `totalEnergy: "0.027"` ✅
- Cálculos usan tiempo real transcurrido ✅

### ⚠️ App móvil debe verificar:
1. **¿Usa el endpoint correcto?** → `/energy/history?period=day`
2. **¿Lee el campo correcto?** → `total_energy` (no `avg_power`)
3. **¿Suma correctamente los buckets?** → Suma de todos los `total_energy`
4. **¿Tiene caché de datos viejos?** → Hacer pull-to-refresh

### 🎯 Valores esperados en la app (2026-03-24):
```
POTENCIA ACTUAL: 0 W
CONSUMO HOY: 0.027 kWh
COSTO ESTIMADO: $0.07 (a $2.50/kWh)
```

Si la app muestra valores diferentes, el problema está en el **código Flutter**, no en el backend.

---

**Fin del brief.**
