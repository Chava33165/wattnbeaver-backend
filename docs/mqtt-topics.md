# Estructura de Topics MQTT - WattBeaber

## Topics de Energía

### Enchufes Sonoff individuales
- `wattnbeaber/energy/sonoff_XX/power` - Potencia instantánea (W)
- `wattnbeaber/energy/sonoff_XX/voltage` - Voltaje (V)
- `wattnbeaber/energy/sonoff_XX/current` - Corriente (A)
- `wattnbeaber/energy/sonoff_XX/energy` - Energía acumulada (kWh)
- `wattnbeaber/energy/sonoff_XX/status` - Estado: online/offline

### Totales
- `wattnbeaber/energy/total/power` - Potencia total de todos los dispositivos
- `wattnbeaber/energy/total/energy` - Energía total acumulada

## Topics de Agua

### Sensores individuales
- `wattnbeaber/water/sensor_XX/flow` - Flujo instantáneo (L/min)
- `wattnbeaber/water/sensor_XX/total` - Volumen total (L)
- `wattnbeaber/water/sensor_XX/status` - Estado: online/offline

### Totales
- `wattnbeaber/water/total/flow` - Flujo total
- `wattnbeaber/water/total/volume` - Volumen total

## Topics del Sistema

- `wattnbeaber/system/status` - Estado general del sistema
- `wattnbeaber/system/alerts` - Alertas y notificaciones
- `wattnbeaber/system/heartbeat` - Heartbeat cada 30s

## Formato de mensajes JSON

### Ejemplo energía:
```json
{
  "device_id": "sonoff_01",
  "timestamp": "2026-01-08T10:30:00Z",
  "power": 150.5,
  "voltage": 127.3,
  "current": 1.18,
  "energy": 2.456
}
```

### Ejemplo agua:
```json
{
  "device_id": "sensor_01",
  "timestamp": "2026-01-08T10:30:00Z",
  "flow": 12.5,
  "total": 1250.8
}
```
