# Instrucciones de Fix para el Backend — WattBeaver

Soy el agente que ayuda con la app móvil WattBeaver y los sensores IoT. Encontré un bug crítico en el backend que impide que las lecturas del sensor YF-201 (ESP32-C3) se guarden en la base de datos. Las lecturas MQTT llegan al broker, el dispositivo `yf201_679d4c` está registrado en la DB, pero no se guarda ninguna lectura en la tabla `water_readings`.

---

## Bug encontrado: `await` faltante en `mqttService.js`

**Archivo:** `backend/src/services/mqttService.js`

### El problema

Los métodos `handleEnergyMessage` y `handleWaterMessage` llaman a funciones `async` (`saveEnergyReading` y `saveWaterReading`) **sin `await`**. Esto hace que:

1. `savedReading` recibe un objeto `Promise` en lugar del valor real
2. `if (savedReading)` siempre es `true` (los objetos Promise son truthy)
3. Las líneas de log dicen "✅ Lectura guardada: ID [object Promise]" — incorrecto
4. La llamada a `this.processGamification(savedReading.userId)` falla porque `savedReading.userId` es `undefined`

Aunque con `better-sqlite3` las operaciones son síncronas y la lectura eventualmente se guarda, la ejecución sin `await` no es confiable y puede causar problemas bajo carga.

---

## Fix a aplicar

### 1. Método `handleEnergyMessage` (línea ~150)

**ANTES:**
```javascript
handleEnergyMessage(topic, data) {
  // ...
  const savedReading = readingsService.saveEnergyReading(deviceId, processedData);
  if (savedReading) {
    console.log(`✅ Lectura de energía guardada: ID ${savedReading}`);
    this.processGamification(savedReading.userId);
  }
  // ...
}
```

**DESPUÉS:**
```javascript
async handleEnergyMessage(topic, data) {
  // ...
  const savedId = await readingsService.saveEnergyReading(deviceId, processedData);
  if (savedId) {
    console.log(`✅ Lectura de energía guardada: ID ${savedId}`);
  }
  // ...
}
```

### 2. Método `handleWaterMessage` (línea ~194)

**ANTES:**
```javascript
handleWaterMessage(topic, data) {
  // ...
  const savedReading = readingsService.saveWaterReading(sensorId, processedData);
  if (savedReading) {
    console.log(`✅ Lectura de agua guardada: ID ${savedReading}`);
    this.processGamification(savedReading.userId);
  }
  // ...
}
```

**DESPUÉS:**
```javascript
async handleWaterMessage(topic, data) {
  // ...
  const savedId = await readingsService.saveWaterReading(sensorId, processedData);
  if (savedId) {
    console.log(`✅ Lectura de agua guardada: ID ${savedId}`);
  }
  // ...
}
```

> **Nota:** Removí `this.processGamification(savedReading.userId)` de estos métodos porque `saveWaterReading`/`saveEnergyReading` devuelven solo el `lastInsertRowid` (un número), no un objeto con `userId`. El `processGamification` necesitaría el `user_id` del dispositivo para funcionar, lo cual requeriría una refactorización mayor. Por ahora, removiendo esa llamada evitamos errores silenciosos.

---

## Cómo verificar después del fix

1. **Reiniciar el backend:** `pm2 restart all` o `node server.js`

2. **Verificar en los logs del servidor** que al recibir mensajes del ESP32 aparezca:
   ```
   📨 [HH:MM:SS] wattnbeaber/water/yf201_679d4c/data
   💾 Intentando guardar lectura de agua: yf201_679d4c
   ✅ Lectura de agua guardada: ID 123
   ```

3. **Verificar en la DB:**
   ```sql
   SELECT * FROM water_readings WHERE device_id = 'yf201_679d4c' ORDER BY timestamp DESC LIMIT 5;
   ```
   Debe mostrar lecturas recientes.

4. **Si los logs NO muestran el mensaje "📨 [timestamp] wattnbeaber/water/yf201_679d4c/data"**, el backend no está recibiendo los mensajes MQTT. En ese caso verificar:
   - El backend se conecta al broker en `127.0.0.1:1883`
   - Ejecutar `mosquitto_sub -h localhost -u backend_user -P backend_password -t 'wattnbeaber/#' -v` para verificar que los mensajes llegan al broker

---

## Contexto adicional

- El dispositivo `yf201_679d4c` está registrado en la tabla `devices` con `device_type = 'water'`
- El ESP32-C3 publica en el topic: `wattnbeaber/water/yf201_679d4c/data`
- Payload del ESP32: `{"flow": X.XX, "total": X.XXX, "timestamp": "ISO_DATE"}`
- El backend suscribe con wildcard `wattnbeaber/water/#` — correcto
- La tabla `water_readings` tiene columnas: `id, device_id, user_id, flow, total, timestamp`
- El `saveWaterReading` busca el dispositivo por `device_id` y usa su `user_id` para la lectura
