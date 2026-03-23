# 📊 Scripts de Monitoreo en Tiempo Real

Scripts para monitorear las lecturas de los sensores IoT en tiempo real.

---

## 🔌 Monitor de Energía (Sonoff POW)

### Uso:
```bash
cd /home/watt/wattnbeaber/scripts
./monitor-energy.sh
```

### Con usuario específico:
```bash
./monitor-energy.sh fc3459fb-acd4-4e6f-8760-ebc3041e3855
```

### Muestra:
- ✅ Última lectura
- ✅ Total de lecturas hoy
- ✅ Potencia promedio
- ✅ Últimas 10 lecturas con:
  - Momento (fecha/hora)
  - Potencia (W)
  - Voltaje (V)
  - Corriente (A)
  - Energía acumulada (kWh)
- ✅ Estado del sensor (activo/inactivo)

**Actualización:** Cada 3 segundos

**Salir:** Presiona `Ctrl + C`

---

## 💧 Monitor de Agua (YF-201)

### Uso:
```bash
cd /home/watt/wattnbeaber/scripts
./monitor-water.sh
```

### Con usuario específico:
```bash
./monitor-water.sh fc3459fb-acd4-4e6f-8760-ebc3041e3855
```

### Muestra:
- ✅ Última lectura
- ✅ Total de lecturas hoy
- ✅ Flujo promedio (L/min)
- ✅ Últimas 10 lecturas con:
  - Momento (fecha/hora)
  - Flujo instantáneo (L/min)
  - Total acumulado (L)
- ✅ Estado del sensor (activo/inactivo)

**Actualización:** Cada 3 segundos

**Salir:** Presiona `Ctrl + C`

---

## 📋 Ejemplos de Salida

### Monitor de Energía:
```
╔════════════════════════════════════════════════════════════════╗
║  Monitor de Energía en Tiempo Real - Sonoff POW               ║
╚════════════════════════════════════════════════════════════════╝

2026-03-22 20:16:40 | Actualización #1

📊 RESUMEN:
   Última lectura: 2026-03-22 18:39:50
   Total hoy:      22 lecturas
   Potencia prom:  3.22 W

📋 ÚLTIMAS 10 LECTURAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Momento              Potencia    Voltaje     Corriente   Energía
2026-03-22 18:39:50  3.22 W      98.4 V      0.473 A     20.387 kWh
2026-03-22 18:39:45  3.22 W      98.4 V      0.473 A     0.145 kWh
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Sensor ACTIVO - Recibiendo datos (22 lecturas en últimos 30s)

Próxima actualización en 3 segundos... (Ctrl+C para salir)
```

---

## 🔧 Solución de Problemas

### Error: "Base de datos no encontrada"
```bash
# Verificar ruta de la base de datos
ls -la /home/watt/wattnbeaber/backend/data/wattnbeaber.db
```

### Sin lecturas recientes
- Verifica que el sensor esté encendido
- Verifica que el backend esté corriendo:
  ```bash
  ps aux | grep "node.*server.js" | grep -v grep
  ```

### Permisos de ejecución
```bash
chmod +x /home/watt/wattnbeaber/scripts/monitor-*.sh
```

---

## 📝 Notas

- Los scripts usan colores para mejor visualización
- Se actualiza automáticamente cada 3 segundos
- Muestra estado del sensor (activo si hay lecturas en últimos 30 segundos)
- Usuario por defecto: Salvador Antonio Pantoja Vera
- Zona horaria: Se convierte automáticamente a hora local

---

## 🎨 Colores

- 🔵 Azul: Headers y marcos
- 🟢 Verde: Datos actuales y estado activo
- 🟡 Amarillo: Etiquetas y advertencias
- 🔴 Rojo: Errores y sensor inactivo
