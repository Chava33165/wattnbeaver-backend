#!/bin/bash

echo "======================================"
echo "🔌 SIMULADOR DE DISPOSITIVO IoT"
echo "======================================"
echo ""

DEVICE_ID=${1:-"sonoff_test"}
INTERVAL=${2:-5}
DURATION=${3:-0}  # Duración en segundos (0 = infinito)

echo "Dispositivo: $DEVICE_ID"
echo "Intervalo: $INTERVAL segundos"
if [ $DURATION -gt 0 ]; then
  echo "Duración: $DURATION segundos"
else
  echo "Presiona Ctrl+C para detener"
fi
echo ""

START_TIME=$(date +%s)
while true; do
  # Verificar si se alcanzó la duración
  if [ $DURATION -gt 0 ]; then
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    if [ $ELAPSED -ge $DURATION ]; then
      echo ""
      echo "⏱️  Tiempo completado ($DURATION segundos)"
      break
    fi
  fi
  # Generar datos aleatorios
  POWER=$((100 + RANDOM % 200))
  VOLTAGE=$((120 + RANDOM % 10))
  CURRENT=$(echo "scale=2; $POWER / $VOLTAGE" | bc)
  ENERGY=$(echo "scale=3; $RANDOM / 1000" | bc)
  TIMESTAMP=$(date -Iseconds)
  
  # Crear mensaje JSON
  MESSAGE=$(cat <<EOF
{
  "device_id": "$DEVICE_ID",
  "power": $POWER,
  "voltage": $VOLTAGE,
  "current": $CURRENT,
  "energy": $ENERGY,
  "timestamp": "$TIMESTAMP"
}
EOF
)
  
  # Publicar en MQTT
  echo "[$(date '+%H:%M:%S')] Publicando: Power=${POWER}W, Voltage=${VOLTAGE}V"
  mosquitto_pub -h localhost \
    -t "wattnbeaber/energy/$DEVICE_ID/data" \
    -m "$MESSAGE" \
    -u sonoff_user \
    -P WattBeaber2026!
  
  sleep $INTERVAL
done
