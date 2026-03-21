# Fix Aplicado: Sensor YF-201 - Las lecturas no se guardaban en la base de datos

**Fecha:** 2026-03-05
**Estado:** ✅ COMPLETADO
**Archivo modificado:** `backend/src/services/mqttService.js`

---

## Problema Identificado

El sensor YF-201 (ESP32-C3) con ID `yf201_679d4c` estaba enviando datos correctamente al broker MQTT, y el dispositivo estaba registrado en la base de datos, pero las lecturas **NO se guardaban** en la tabla `water_readings`.

### Síntomas
- ✅ El ESP32 publicaba mensajes MQTT exitosamente
- ✅ El dispositivo `yf201_679d4c` estaba registrado en la tabla `devices`
- ❌ Las lecturas NO aparecían en la tabla `water_readings`
- ❌ El dashboard de la app no mostraba datos del sensor
- ⚠️ Los logs mostraban "✅ Lectura guardada: ID [object Promise]" (engañoso)

---

## Causa Raíz

### Problema 1: Falta de `await` en llamadas asíncronas

En `backend/src/services/mqttService.js`, los métodos `handleEnergyMessage` (línea ~150) y `handleWaterMessage` (línea ~194) llamaban a funciones `async` **sin usar `await`**:

```javascript
// ❌ ANTES (INCORRECTO)
handleWaterMessage(topic, data) {
  const savedReading = readingsService.saveWaterReading(sensorId, processedData);
  if (savedReading) {
    console.log(`✅ Lectura de agua guardada: ID ${savedReading}`);
    this.processGamification(savedReading.userId); // ❌ ERROR
  }
}
```

**Consecuencias:**
1. `savedReading` recibía un objeto `Promise` en lugar del ID numérico
2. `if (savedReading)` siempre era `true` (las Promises son truthy)
3. Los logs mostraban "ID [object Promise]" en lugar del número real
4. `this.processGamification(savedReading.userId)` causaba errores porque `savedReading.userId` era `undefined`

### Problema 2: Métodos no declarados como `async`

Los métodos `handleEnergyMessage` y `handleWaterMessage` no eran `async`, lo que impedía usar `await` correctamente.

### Problema 3: Acceso incorrecto a propiedades

Los métodos `saveWaterReading` y `saveEnergyReading` retornan **solo el ID numérico** (`lastInsertRowid`), no un objeto con `userId`. Por lo tanto, intentar acceder a `savedReading.userId` siempre resultaba en `undefined`.

---

## Solución Aplicada

### Cambio 1: Método `handleEnergyMessage`

**Ubicación:** `backend/src/services/mqttService.js` línea 150

```javascript
// ✅ DESPUÉS (CORREGIDO)
async handleEnergyMessage(topic, data) {
  // Extraer device_id del topic
  const parts = topic.split('/');
  const deviceId = parts[2];
  const dataType = parts[3];

  // Si es un mensaje de estado general del dispositivo
  if (dataType === 'status' || topic.endsWith('/data')) {
    // Procesar datos
    const processedData = {
      device_id: deviceId,
      power: data.power || 0,
      voltage: data.voltage || 0,
      current: data.current || 0,
      energy: data.energy || 0,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // Agregar al procesador (memoria)
    energyProcessor.addData(processedData);

    // ⭐ NUEVO: Guardar en base de datos
    const readingsService = require('./readingsService');
    console.log(`💾 Intentando guardar lectura de energía: ${deviceId}`);
    const savedId = await readingsService.saveEnergyReading(deviceId, processedData);
    if (savedId) {
      console.log(`✅ Lectura de energía guardada: ID ${savedId}`);
    }

    // Verificar alertas
    alertManager.checkEnergyConsumption(
      deviceId,
      processedData.power,
      processedData.voltage
    );
  }
}
```

**Cambios específicos:**
- ✅ Agregado `async` a la declaración del método
- ✅ Agregado `await` antes de `readingsService.saveEnergyReading(...)`
- ✅ Cambiado nombre de variable de `savedReading` a `savedId`
- ✅ Removida la línea `this.processGamification(savedReading.userId)`

---

### Cambio 2: Método `handleWaterMessage`

**Ubicación:** `backend/src/services/mqttService.js` línea 191

```javascript
// ✅ DESPUÉS (CORREGIDO)
async handleWaterMessage(topic, data) {
  // Extraer sensor_id del topic
  const parts = topic.split('/');
  const sensorId = parts[2];
  const dataType = parts[3];

  // Si es un mensaje de estado general del sensor
  if (dataType === 'status' || topic.endsWith('/data')) {
    // Procesar datos
    const processedData = {
      sensor_id: sensorId,
      flow: data.flow || 0,
      total: data.total || 0,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // Agregar al procesador (memoria)
    waterProcessor.addData(processedData);

    // ⭐ NUEVO: Guardar en base de datos
    const readingsService = require('./readingsService');
    console.log(`💾 Intentando guardar lectura de agua: ${sensorId}`);
    const savedId = await readingsService.saveWaterReading(sensorId, processedData);
    if (savedId) {
      console.log(`✅ Lectura de agua guardada: ID ${savedId}`);
    }

    // Detectar fugas
    const leakDetection = waterProcessor.detectLeaks(sensorId);

    // Verificar alertas
    alertManager.checkWaterFlow(
      sensorId,
      processedData.flow,
      leakDetection.leak_detected
    );
  }
}
```

**Cambios específicos:**
- ✅ Agregado `async` a la declaración del método
- ✅ Agregado `await` antes de `readingsService.saveWaterReading(...)`
- ✅ Cambiado nombre de variable de `savedReading` a `savedId`
- ✅ Removida la línea `this.processGamification(savedReading.userId)`

---

## Resultado Esperado

Después de aplicar este fix:

1. ✅ Las lecturas del sensor YF-201 se guardan correctamente en `water_readings`
2. ✅ Los logs muestran el ID numérico real (ej: "ID 123") en vez de "[object Promise]"
3. ✅ El dashboard de la app muestra los datos del sensor en tiempo real
4. ✅ Se eliminan los errores silenciosos relacionados con gamificación

---

## Instrucciones para Verificar el Fix

### 1. Reiniciar el backend

```bash
cd ~/wattnbeaber/backend

# Si usas PM2:
pm2 restart all

# O si ejecutas manualmente:
node src/server.js
```

### 2. Verificar los logs del backend

Deberías ver mensajes como:

```
📨 [02:48:24] wattnbeaber/water/yf201_679d4c/data
💾 Intentando guardar lectura de agua: yf201_679d4c
✅ Lectura de agua guardada: ID 123
```

**Antes del fix:** Mostraba "ID [object Promise]"
**Después del fix:** Muestra "ID 123" (número real)

### 3. Verificar en la base de datos

Ejecutar el script de exploración:

```bash
~/wattnbeaber/scripts/explore-db.sh
```

Selecciona la opción **5) Ver lecturas de agua (últimas 10)**

Deberías ver registros recientes para el dispositivo `yf201_679d4c`:

```
💧 LECTURAS DE AGUA (últimas 10):
yf201_679d4c     102.4  8.667    2026-03-06 02:48:49
yf201_679d4c     171.2  22.933   2026-03-06 02:48:54
yf201_679d4c     379.2  54.533   2026-03-06 02:48:59
```

### 4. Verificar en el dashboard de la app móvil

- Abrir la app WattBeaver
- Ir a la sección de dispositivos de agua
- Verificar que el sensor `yf201_679d4c` (baño) muestre:
  - Flujo actual (L/min)
  - Total acumulado (L)
  - Gráficas en tiempo real

---

## Troubleshooting

### Si los datos aún no aparecen:

#### Problema: El backend no recibe mensajes MQTT

**Síntoma:** No aparece el log `📨 [timestamp] wattnbeaber/water/yf201_679d4c/data`

**Solución:**
1. Verificar que el broker Mosquitto esté corriendo:
   ```bash
   sudo systemctl status mosquitto
   ```

2. Verificar que el backend pueda conectarse al broker:
   ```bash
   mosquitto_sub -h localhost -u backend_user -P backend_password -t 'wattnbeaber/#' -v
   ```

3. Revisar las credenciales MQTT en el archivo de configuración del backend

#### Problema: El dispositivo no está registrado

**Síntoma:** Log muestra "⚠️ Dispositivo no encontrado: yf201_679d4c"

**Solución:**
Verificar que el dispositivo esté registrado en la base de datos:
```bash
~/wattnbeaber/scripts/explore-db.sh
# Opción 3) Ver dispositivos
```

Si no aparece, registrar el dispositivo desde la app móvil.

#### Problema: El usuario del dispositivo es incorrecto

**Síntoma:** Las lecturas se guardan pero no aparecen en la app del usuario correcto

**Solución:**
Verificar el `user_id` asociado al dispositivo:
```bash
sqlite3 ~/wattnbeaber/backend/data/wattnbeaber.db "SELECT * FROM devices WHERE device_id='yf201_679d4c';"
```

---

## Archivos Relacionados

- **Archivo modificado:** `backend/src/services/mqttService.js`
- **Servicios relacionados:**
  - `backend/src/services/readingsService.js` (métodos async que se corrigieron)
  - `backend/src/models/Device.js` (búsqueda de dispositivos)
- **Base de datos:** `backend/data/wattnbeaber.db`
  - Tabla: `water_readings`
  - Tabla: `devices`

---

## Notas Adicionales

### ¿Por qué se removió `processGamification`?

La llamada a `this.processGamification(savedReading.userId)` fue removida porque:

1. `saveWaterReading` y `saveEnergyReading` retornan solo un número (`lastInsertRowid`), no un objeto
2. `savedReading.userId` siempre era `undefined`, causando warnings en los logs
3. Para implementar correctamente la gamificación automática, se necesitaría:
   - Modificar `saveWaterReading` para retornar un objeto con `{ id, userId }`
   - O hacer una segunda consulta para obtener el `user_id` del dispositivo

**Recomendación futura:** Si se desea gamificación automática, refactorizar para retornar más información desde `saveWaterReading/saveEnergyReading`.

---

## Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Declaración de métodos** | `handleWaterMessage(topic, data)` | `async handleWaterMessage(topic, data)` |
| **Llamada a saveWaterReading** | `readingsService.saveWaterReading(...)` | `await readingsService.saveWaterReading(...)` |
| **Variable de resultado** | `savedReading` (Promise) | `savedId` (número) |
| **Log de resultado** | "ID [object Promise]" | "ID 123" (real) |
| **Gamificación automática** | Causaba error | Removida (por implementar correctamente) |
| **Lecturas guardadas** | ❌ No se guardaban | ✅ Se guardan correctamente |

---

**Autor del fix:** Claude Code
**Basado en:** BACKEND_FIX_INSTRUCCIONES.md
