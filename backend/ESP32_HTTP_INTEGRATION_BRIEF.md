# WattBeaver ESP32 - Brief de Integración HTTP/HTTPS

## 📋 Resumen

Las ESP32 enviarán datos de sensores (YF-201 para agua, PZEM-004T para energía) vía HTTPS al backend a través de Cloudflare Tunnel, reemplazando la conexión MQTT que no funciona remotamente.

---

## 🌐 Endpoints del Backend

**Base URL**: `https://wattnbeaver-api.wattnbeaver.site/api/v1`

### Endpoint de Agua (YF-201)
```
POST /ingest/water
```

### Endpoint de Energía (PZEM-004T, Sonoff POW)
```
POST /ingest/energy
```

---

## 🔐 Autenticación

Se usa el header `X-Device-Api-Key` con la API key única del dispositivo.

**La API key se obtiene desde**:
1. Usuario registra el dispositivo en la app Flutter
2. Backend genera automáticamente una API key única (UUID)
3. Usuario ve la API key en la app (pantalla de detalle del dispositivo)
4. Usuario configura la ESP32 vía WiFiManager (portal captive) copiando la API key

---

## 📡 Configuración WiFiManager

### Portal Captive (192.168.4.1)

```cpp
#include <WiFiManager.h>

WiFiManager wifiManager;

// Parámetros personalizados para el portal
WiFiManagerParameter custom_device_id("device", "Device ID", "sensor_001", 20);
WiFiManagerParameter custom_api_key("apikey", "API Key del Dispositivo", "", 40);

// Agregar parámetros al portal
wifiManager.addParameter(&custom_device_id);
wifiManager.addParameter(&custom_api_key);

// Iniciar portal (crea AP "WattBeaver-Setup")
if (!wifiManager.autoConnect("WattBeaver-Setup")) {
  Serial.println("❌ Fallo al conectar WiFi");
  ESP.restart();
}

// Guardar configuración en SPIFFS/Preferences
preferences.begin("wattbeaver", false);
preferences.putString("device_id", custom_device_id.getValue());
preferences.putString("api_key", custom_api_key.getValue());
preferences.end();

Serial.println("✅ Configuración guardada");
```

---

## 📤 Formato de Peticiones HTTP

### Sensor de Agua (YF-201)

```http
POST https://wattnbeaver-api.wattnbeaver.site/api/v1/ingest/water
Content-Type: application/json
X-Device-Api-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890

{
  "device_id": "sensor_001",
  "flow": 2.5,
  "total": 100.0,
  "timestamp": "2026-03-20T12:34:56Z"
}
```

#### Parámetros del Body:
| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `device_id` | string | ✅ Sí | ID único del sensor (debe existir en BD) | "sensor_001" |
| `flow` | number | ❌ No | Flujo de agua en L/min (≥ 0) | 2.5 |
| `total` | number | ❌ No | Total acumulado en litros (≥ 0) | 100.0 |
| `timestamp` | string | ❌ No | ISO 8601 (se genera auto si no se envía) | "2026-03-20T12:34:56Z" |

**Nota**: Al menos uno de `flow` o `total` debe estar presente.

---

### Sensor de Energía (PZEM-004T / Sonoff POW)

```http
POST https://wattnbeaver-api.wattnbeaver.site/api/v1/ingest/energy
Content-Type: application/json
X-Device-Api-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890

{
  "device_id": "sonoff_01",
  "power": 150.5,
  "voltage": 220.0,
  "current": 0.68,
  "energy": 1250.0,
  "timestamp": "2026-03-20T12:34:56Z"
}
```

#### Parámetros del Body:
| Campo | Tipo | Requerido | Descripción | Validación | Ejemplo |
|-------|------|-----------|-------------|------------|---------|
| `device_id` | string | ✅ Sí | ID único del sensor | - | "sonoff_01" |
| `power` | number | ❌ No | Potencia en W | ≥ 0 | 150.5 |
| `voltage` | number | ❌ No | Voltaje en V | 100-250 | 220.0 |
| `current` | number | ❌ No | Corriente en A | ≥ 0 | 0.68 |
| `energy` | number | ❌ No | Energía acumulada en Wh | ≥ 0 | 1250.0 |
| `timestamp` | string | ❌ No | ISO 8601 | - | "2026-03-20T12:34:56Z" |

**Nota**: Al menos uno de los campos de medición debe estar presente.

---

## 📥 Respuestas del Servidor

### 200 OK - Lectura guardada correctamente
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

### 400 Bad Request - Datos inválidos
```json
{
  "success": false,
  "message": "Datos inválidos: flow debe ser mayor o igual a 0"
}
```

### 401 Unauthorized - API Key inválida
```json
{
  "success": false,
  "message": "API Key individual inválida"
}
```

### 404 Not Found - Dispositivo no encontrado
```json
{
  "success": false,
  "message": "Dispositivo no encontrado"
}
```

### 429 Too Many Requests - Rate limit excedido
```json
{
  "success": false,
  "message": "Demasiadas peticiones. Límite: 1 request por segundo.",
  "retryAfter": 60
}
```

---

## 💻 Código de Ejemplo para ESP32

### Librería HTTPS Recomendada

```cpp
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
```

---

### Función de Envío de Datos (Agua)

```cpp
const char* serverUrl = "https://wattnbeaver-api.wattnbeaver.site/api/v1";

void sendWaterReading(float flow, float total) {
  // Cargar configuración desde Preferences
  Preferences preferences;
  preferences.begin("wattbeaver", true);
  String apiKey = preferences.getString("api_key", "");
  String deviceId = preferences.getString("device_id", "sensor_001");
  preferences.end();

  if (apiKey.length() == 0) {
    Serial.println("❌ API Key no configurada. Abre el portal WiFiManager.");
    return;
  }

  // Preparar JSON
  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["flow"] = flow;
  doc["total"] = total;
  // timestamp es opcional - el backend lo genera si no se envía

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // Configurar cliente HTTPS
  WiFiClientSecure client;
  client.setInsecure(); // Para testing - en producción usar certificado CA

  HTTPClient https;
  https.begin(client, String(serverUrl) + "/ingest/water");
  https.addHeader("Content-Type", "application/json");
  https.addHeader("X-Device-Api-Key", apiKey);

  // Enviar POST
  int httpCode = https.POST(jsonPayload);

  if (httpCode == 200) {
    String response = https.getString();
    Serial.println("✅ Datos enviados correctamente");
    Serial.println(response);
  } else if (httpCode == 401) {
    Serial.println("❌ API Key inválida - revisar configuración");
  } else if (httpCode == 404) {
    Serial.println("❌ Dispositivo no encontrado - verificar device_id");
  } else if (httpCode == 429) {
    Serial.println("⚠️  Rate limit excedido - esperando 1 segundo");
    delay(1000);
  } else {
    Serial.printf("❌ Error HTTP %d\n", httpCode);
    String response = https.getString();
    Serial.println(response);
  }

  https.end();
}
```

---

### Función de Envío de Datos (Energía)

```cpp
void sendEnergyReading(float power, float voltage, float current, float energy) {
  Preferences preferences;
  preferences.begin("wattbeaver", true);
  String apiKey = preferences.getString("api_key", "");
  String deviceId = preferences.getString("device_id", "sonoff_01");
  preferences.end();

  if (apiKey.length() == 0) {
    Serial.println("❌ API Key no configurada");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["power"] = power;
  doc["voltage"] = voltage;
  doc["current"] = current;
  doc["energy"] = energy;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.begin(client, String(serverUrl) + "/ingest/energy");
  https.addHeader("Content-Type", "application/json");
  https.addHeader("X-Device-Api-Key", apiKey);

  int httpCode = https.POST(jsonPayload);

  if (httpCode == 200) {
    String response = https.getString();
    Serial.println("✅ Datos de energía enviados");
    Serial.println(response);
  } else {
    Serial.printf("❌ Error HTTP %d\n", httpCode);
  }

  https.end();
}
```

---

## 🧪 Ejemplo Completo: Sensor de Agua YF-201

```cpp
#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

#define FLOW_SENSOR_PIN 4

const char* serverUrl = "https://wattnbeaver-api.wattnbeaver.site/api/v1";

Preferences preferences;
volatile int pulseCount = 0;
float flowRate = 0.0;
float totalLiters = 0.0;
unsigned long lastSendTime = 0;

// Interrupción para contar pulsos del sensor YF-201
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 WattBeaver - Sensor de Agua YF-201");

  // Configurar WiFiManager
  WiFiManager wifiManager;
  WiFiManagerParameter custom_device_id("device", "Device ID", "sensor_001", 20);
  WiFiManagerParameter custom_api_key("apikey", "API Key", "", 40);

  wifiManager.addParameter(&custom_device_id);
  wifiManager.addParameter(&custom_api_key);

  // Intentar conectar (o abrir portal si falla)
  if (!wifiManager.autoConnect("WattBeaver-Setup")) {
    Serial.println("❌ Fallo al conectar WiFi - reiniciando");
    ESP.restart();
  }

  Serial.println("✅ WiFi conectado");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Guardar configuración
  preferences.begin("wattbeaver", false);
  preferences.putString("device_id", custom_device_id.getValue());
  preferences.putString("api_key", custom_api_key.getValue());
  preferences.end();

  Serial.println("✅ Configuración guardada en memoria");

  // Configurar sensor de flujo
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  Serial.println("🌊 Sensor de flujo iniciado");
}

void loop() {
  // Leer sensor cada 1 segundo
  delay(1000);

  // Calcular flujo (YF-201: ~7.5 pulsos por litro)
  detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));
  flowRate = (pulseCount / 7.5); // L/min
  totalLiters += (flowRate / 60.0); // Acumular litros
  pulseCount = 0;
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  Serial.printf("💧 Flujo: %.2f L/min | Total: %.2f L\n", flowRate, totalLiters);

  // Enviar datos cada 5 segundos (respetar rate limit de 1/seg)
  if (millis() - lastSendTime > 5000) {
    sendWaterReading(flowRate, totalLiters);
    lastSendTime = millis();
  }
}

void sendWaterReading(float flow, float total) {
  preferences.begin("wattbeaver", true);
  String apiKey = preferences.getString("api_key", "");
  String deviceId = preferences.getString("device_id", "sensor_001");
  preferences.end();

  if (apiKey.length() == 0) {
    Serial.println("❌ API Key no configurada");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["flow"] = flow;
  doc["total"] = total;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.begin(client, String(serverUrl) + "/ingest/water");
  https.addHeader("Content-Type", "application/json");
  https.addHeader("X-Device-Api-Key", apiKey);
  https.setTimeout(5000); // Timeout de 5 segundos

  int httpCode = https.POST(jsonPayload);

  if (httpCode == 200) {
    Serial.println("✅ Datos enviados al servidor");
  } else if (httpCode == 401) {
    Serial.println("❌ API Key inválida");
  } else if (httpCode == 404) {
    Serial.println("❌ Dispositivo no encontrado");
  } else if (httpCode == 429) {
    Serial.println("⚠️  Rate limit - reducir frecuencia");
  } else {
    Serial.printf("❌ Error HTTP %d\n", httpCode);
  }

  https.end();
}
```

---

## ⚡ Rate Limiting

**Límite**: 60 requests por minuto = **1 request por segundo por dispositivo**

### Recomendaciones:

1. **Enviar cada 5-10 segundos** para sensores continuos
2. **Usar buffer local** si necesitas leer más frecuentemente
3. **Manejo de error 429**: Esperar 60 segundos antes de reintentar

```cpp
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000; // 5 segundos

void loop() {
  // Leer sensor...

  if (millis() - lastSendTime > SEND_INTERVAL) {
    sendWaterReading(flow, total);
    lastSendTime = millis();
  }
}
```

---

## 🔒 Certificado SSL (Producción)

Para validar el certificado de Cloudflare en producción:

```cpp
// Certificado raíz de Cloudflare
const char* rootCACertificate = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n" \
"...\n" \
"-----END CERTIFICATE-----\n";

WiFiClientSecure client;
client.setCACert(rootCACertificate); // En lugar de client.setInsecure()
```

**Para obtener el certificado**:
```bash
openssl s_client -showcerts -connect wattnbeaver-api.wattnbeaver.site:443 < /dev/null
```

---

## 🆘 Troubleshooting

### Error 401: API Key inválida
- **Causa**: La API key no coincide o no existe
- **Solución**:
  1. Verificar que el dispositivo esté registrado en la app
  2. Copiar nuevamente la API key desde la app
  3. Reconfigurar WiFiManager con la clave correcta

### Error 404: Dispositivo no encontrado
- **Causa**: El `device_id` no existe en la base de datos
- **Solución**: Registrar el dispositivo desde la app Flutter primero

### Error 429: Rate limit excedido
- **Causa**: Más de 60 requests en 1 minuto
- **Solución**: Reducir frecuencia de envío (mínimo 1 segundo entre requests)

### Sin respuesta del servidor
- **Verificar**:
  1. Conexión WiFi: `WiFi.status() == WL_CONNECTED`
  2. DNS: `ping wattnbeaver-api.wattnbeaver.site`
  3. Timeout HTTP: Aumentar a 10 segundos si conexión lenta

---

## 📦 Dependencias de PlatformIO

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

lib_deps =
    WiFiManager @ ^2.0.16-rc.2
    bblanchon/ArduinoJson @ ^7.0.3
```

---

## ✅ Checklist de Implementación ESP32

- [ ] Instalar librerías: WiFiManager, ArduinoJson, HTTPClient
- [ ] Configurar portal WiFiManager con campos `device_id` y `api_key`
- [ ] Guardar configuración en Preferences/SPIFFS
- [ ] Implementar lectura del sensor (YF-201 o PZEM-004T)
- [ ] Implementar función `sendWaterReading()` o `sendEnergyReading()`
- [ ] Agregar manejo de errores HTTP (401, 404, 429)
- [ ] Configurar rate limiting (max 1 request/seg)
- [ ] Testing: Enviar datos al servidor y verificar en la base de datos
- [ ] Producción: Agregar certificado SSL de Cloudflare
- [ ] Logging: Agregar mensajes Serial para debugging

---

**Documento generado para el equipo de ESP32 de WattBeaver**
**Fecha**: 2026-03-20
**Backend API**: https://wattnbeaver-api.wattnbeaver.site/api/v1
**Rate Limit**: 60 requests/min (1/seg)
