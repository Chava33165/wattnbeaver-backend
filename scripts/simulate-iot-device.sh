#!/bin/bash

echo "======================================"
echo "🔌 SIMULADOR DE DISPOSITIVO IoT"
echo "======================================"
echo ""

DEVICE_ID=${1:-"sonoff_test"}
INTERVAL=${2:-5}

echo "Dispositivo: $DEVICE_ID"
echo "Intervalo: $INTERVAL segundos"
echo "Presiona Ctrl+C para detener"
echo ""

while true; do
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
