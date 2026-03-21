# WattBeaver - HTTP Ingest API para ESP32

## 📋 Resumen

Sistema de ingesta de datos vía HTTPS para dispositivos ESP32 que envían lecturas de sensores de agua (YF-201) y energía (PZEM-004T) a través de Cloudflare Tunnel.

**Problema resuelto**: Cloudflare Tunnel no soporta TCP puro (MQTT), por lo que las ESP32 ahora usan HTTPS.

---

## 🚀 Quick Start

### 1. Ejecutar Migración de Base de Datos

```bash
cd /home/watt/wattnbeaber/backend
node scripts/migrate-add-apikey.js
```

**Resultado esperado**:
```
✅ Migración completada exitosamente
   - Columna: api_key
   - Tipo: TEXT
   - Índice único: Sí
✅ API keys generadas para X dispositivos
```

### 2. Verificar Configuración del `.env`

```bash
# Device API (para ESP32 vía HTTPS)
DEVICE_API_KEY=WattBeaver_Device_Global_Key_2026_Change_In_Production_Min32Chars
DEVICE_RATE_LIMIT=60
```

### 3. Reiniciar el Servidor

```bash
npm start
# o
pm2 restart wattnbeaver-backend
```

### 4. Verificar Endpoints

```bash
curl https://wattnbeaver-api.wattnbeaver.site/api/v1/health
```

---

## 🧪 Testing

### Configurar Script de Testing

1. Editar `test-ingest.sh`:

```bash
nano test-ingest.sh
```

2. Configurar las variables:

```bash
DEVICE_API_KEY="abc123-uuid-de-tu-dispositivo"  # Obtener de GET /devices/:id
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6..."    # Token del usuario
DEVICE_UUID="uuid-del-dispositivo"               # UUID interno de BD
DEVICE_ID="sensor_001"                           # ID del hardware
```

3. Ejecutar tests:

```bash
# Ver ayuda
./test-ingest.sh help

# Ejecutar todos los tests
./test-ingest.sh all

# Test individual
./test-ingest.sh water
./test-ingest.sh energy
./test-ingest.sh errors
```

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

```
backend/
├── scripts/
│   └── migrate-add-apikey.js                     # Script de migración de BD
├── src/
│   ├── middlewares/
│   │   └── deviceAuth.js                         # Middleware autenticación híbrida
│   ├── controllers/
│   │   └── ingest/
│   │       └── ingestController.js               # Controladores de ingesta
│   └── routes/
│       └── api/
│           └── ingestRoutes.js                   # Rutas de ingesta
├── test-ingest.sh                                # Script de testing
├── FLUTTER_API_KEYS_BRIEF.md                     # Brief para equipo Flutter
├── ESP32_HTTP_INTEGRATION_BRIEF.md               # Brief para equipo ESP32
└── INGEST_API_README.md                          # Este archivo
```

### Archivos Modificados

```
backend/
├── .env                                          # Agregadas vars DEVICE_API_KEY y DEVICE_RATE_LIMIT
├── src/
│   ├── config/config.js                          # Expuesta configuración de device API
│   ├── models/Device.js                          # Agregados métodos para api_key
│   ├── controllers/devices/deviceController.js   # Agregado método rotateApiKey
│   ├── routes/api/deviceRoutes.js                # Agregada ruta rotate-key
│   └── routes/index.js                           # Registradas rutas ingest
```

---

## 🔌 Endpoints Disponibles

### Ingesta de Datos (para ESP32)

#### POST /api/v1/ingest/water
Recibe lecturas de sensores de agua (YF-201)

**Headers**:
- `Content-Type: application/json`
- `X-Device-Api-Key: <api_key_individual>` o `X-Device-Key: <api_key_global>`

**Body**:
```json
{
  "device_id": "sensor_001",
  "flow": 2.5,
  "total": 100.0,
  "timestamp": "2026-03-20T12:34:56Z"  // Opcional
}
```

**Respuesta 200 OK**:
```json
{
  "success": true,
  "message": "Lectura de agua guardada correctamente",
  "data": {
    "id": 12345,
    "device_id": "sensor_001",
    "flow": 2.5,
    "total": 100.0,
    "timestamp": "2026-03-20T12:34:56Z"
  }
}
```

---

#### POST /api/v1/ingest/energy
Recibe lecturas de sensores de energía (PZEM-004T, Sonoff POW)

**Headers**:
- `Content-Type: application/json`
- `X-Device-Api-Key: <api_key_individual>` o `X-Device-Key: <api_key_global>`

**Body**:
```json
{
  "device_id": "sonoff_01",
  "power": 150.5,
  "voltage": 220.0,
  "current": 0.68,
  "energy": 1250.0,
  "timestamp": "2026-03-20T12:34:56Z"  // Opcional
}
```

---

### Gestión de Dispositivos (para App Flutter)

#### GET /api/v1/devices/:id
Obtener detalle del dispositivo (ahora incluye `api_key`)

**Headers**:
- `Authorization: Bearer <jwt_token>`

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "device": {
      "id": "abc-123-uuid",
      "device_id": "sensor_001",
      "device_name": "Sensor Cocina",
      "device_type": "water",
      "location": "Cocina",
      "status": "active",
      "api_key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ⬅️ NUEVO
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  }
}
```

---

#### POST /api/v1/devices/:id/rotate-key
Rotar API key de un dispositivo (genera nueva clave)

**Headers**:
- `Authorization: Bearer <jwt_token>`

**Respuesta**:
```json
{
  "success": true,
  "message": "API Key rotada exitosamente",
  "data": {
    "device": {
      "id": "abc-123-uuid",
      "api_key": "nueva-clave-generada-aqui",
      // ... otros campos
    },
    "warning": "API Key rotada exitosamente. Actualiza la configuración de tu ESP32 con la nueva clave."
  }
}
```

---

## 🔐 Autenticación

### Modo Híbrido (Doble Sistema)

El middleware `deviceAuth` soporta dos modos de autenticación:

#### 1. API Key Individual (Recomendado)
- **Header**: `X-Device-Api-Key: <uuid_generado_por_dispositivo>`
- **Ventajas**: Seguridad granular, revocación individual, auditoría
- **Uso**: Dispositivos en producción

#### 2. API Key Global (Fallback)
- **Header**: `X-Device-Key: <clave_global_del_env>`
- **Ventajas**: Simplicidad, migración gradual
- **Uso**: Testing, dispositivos legacy

**Prioridad**: Individual → Global → 401 Unauthorized

---

## ⚡ Rate Limiting

**Límite**: 60 requests por minuto por dispositivo = **1 request/segundo**

**Suficiente para**:
- YF-201: Envío cada 5-10 segundos
- PZEM-004T: Envío cada 5-10 segundos

**Respuesta 429**:
```json
{
  "success": false,
  "message": "Demasiadas peticiones. Límite: 1 request por segundo.",
  "retryAfter": 60
}
```

---

## 🔄 Flujo Completo de Aprovisionamiento

### Desde la Perspectiva del Usuario

1. **App Flutter**: Registrar dispositivo → `POST /devices/link`
   ```json
   {
     "device_id": "sensor_001",
     "device_name": "Sensor Cocina",
     "device_type": "water",
     "location": "Cocina"
   }
   ```

2. **Backend**: Genera automáticamente `api_key` (UUID)

3. **App Flutter**: Ver detalle → `GET /devices/:id` → Muestra `api_key`

4. **Usuario**: Copia la `api_key` desde la app (o escanea QR)

5. **Usuario**: Enciende ESP32 → Se crea Access Point "WattBeaver-Setup"

6. **Usuario**: Se conecta al AP y abre http://192.168.4.1

7. **Usuario**: En el portal WiFiManager, pega:
   - WiFi SSID
   - WiFi Password
   - **API Key** (copiada de la app)

8. **ESP32**: Guarda configuración en SPIFFS/Preferences

9. **ESP32**: Se conecta a WiFi y envía datos:
   ```cpp
   POST /ingest/water
   Headers: X-Device-Api-Key: <api_key_guardada>
   Body: {"device_id": "sensor_001", "flow": 2.5, "total": 100.0}
   ```

10. **Backend**: Valida `api_key` → Guarda en SQLite → App Flutter muestra datos

---

## 📊 Validaciones Implementadas

### Sensor de Agua
- ✅ `flow >= 0`
- ✅ `total >= 0`
- ✅ `device_type === 'water'`

### Sensor de Energía
- ✅ `power >= 0`
- ✅ `voltage` entre 100-250V
- ✅ `current >= 0`
- ✅ `energy >= 0`
- ✅ `device_type === 'energy'`

---

## 🆘 Troubleshooting

### Error: "API Key inválida"

**Síntomas**: Respuesta 401 Unauthorized

**Causas**:
1. API key no coincide con la BD
2. Dispositivo no registrado
3. API key rotada pero ESP32 no actualizada

**Solución**:
1. Verificar en app Flutter: `GET /devices/:id` → Ver `api_key` actual
2. Comparar con la configurada en ESP32
3. Si no coinciden, reconfigurar WiFiManager con la correcta
4. Si es necesario, rotar clave: `POST /devices/:id/rotate-key`

---

### Error: "Dispositivo no encontrado"

**Síntomas**: Respuesta 404 Not Found

**Causas**:
1. `device_id` no existe en tabla `devices`
2. Typo en el `device_id` de la ESP32

**Solución**:
1. Verificar que el dispositivo esté registrado en la app
2. Verificar spelling del `device_id` en código ESP32
3. Verificar en BD: `SELECT * FROM devices WHERE device_id = 'sensor_001'`

---

### Error: "Rate limit excedido"

**Síntomas**: Respuesta 429 Too Many Requests

**Causas**:
- ESP32 envía datos más frecuentemente que 1/segundo

**Solución**:
```cpp
// En ESP32, agregar delay entre envíos
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000; // 5 segundos

if (millis() - lastSendTime > SEND_INTERVAL) {
  sendWaterReading(flow, total);
  lastSendTime = millis();
}
```

---

## 📚 Documentación Adicional

### Para el Equipo de Flutter
Ver: [`FLUTTER_API_KEYS_BRIEF.md`](./FLUTTER_API_KEYS_BRIEF.md)

- Diseño de UI para mostrar API keys
- Implementación de rotación de claves
- Código de ejemplo en Dart
- Modelo de datos actualizado

### Para el Equipo de ESP32
Ver: [`ESP32_HTTP_INTEGRATION_BRIEF.md`](./ESP32_HTTP_INTEGRATION_BRIEF.md)

- Configuración WiFiManager
- Código completo de ejemplo (YF-201 y PZEM-004T)
- Manejo de errores HTTP
- Certificados SSL para producción

---

## ✅ Checklist de Deployment

- [x] Ejecutar migración de BD
- [x] Configurar variables de entorno (.env)
- [ ] Reiniciar servidor backend
- [ ] Verificar endpoints con `test-ingest.sh`
- [ ] Probar desde ESP32 real
- [ ] Actualizar app Flutter con nuevos endpoints
- [ ] Documentar proceso en wiki del equipo
- [ ] Configurar monitoreo de rate limiting
- [ ] Revisar logs de intentos fallidos de autenticación

---

## 🔒 Notas de Seguridad

1. **API Keys en producción**: Cambiar `DEVICE_API_KEY` del `.env` por una clave robusta
2. **Logging**: Los intentos fallidos se loggean automáticamente (ver consola del servidor)
3. **Certificados SSL**: En producción, usar certificado válido de Cloudflare (no `setInsecure()`)
4. **Rotación de claves**: Implementada para casos de compromiso
5. **Rate limiting**: Protege contra abuso/ataques DoS

---

## 📞 Soporte

**Implementado por**: Claude Code
**Fecha**: 2026-03-20
**Versión**: 1.0.0

**Contacto**:
- Backend: wattnbeaver-backend team
- Flutter: wattnbeaver-app team
- ESP32: wattnbeaver-firmware team

---

## 📝 Changelog

### v1.0.0 (2026-03-20)
- ✅ Implementación inicial de HTTP Ingest API
- ✅ Middleware de autenticación híbrida (individual + global)
- ✅ Endpoints `/ingest/water` y `/ingest/energy`
- ✅ Autogeneración de API keys en dispositivos
- ✅ Endpoint `/devices/:id/rotate-key` para rotar claves
- ✅ Rate limiting (60 req/min)
- ✅ Validaciones de rangos de datos
- ✅ Migración de BD con script automatizado
- ✅ Scripts de testing completos
- ✅ Documentación para Flutter y ESP32
