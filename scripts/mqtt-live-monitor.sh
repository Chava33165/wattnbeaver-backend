#!/bin/bash

echo "======================================"
echo "📡 MONITOR MQTT EN VIVO - WattBeaber"
echo "======================================"
echo "Presiona Ctrl+C para salir"
echo ""
echo "Escuchando todos los topics de WattBeaber..."
echo ""

mosquitto_sub -h localhost -t "wattnbeaber/#" -v -u mqtt_user -P watt | while read -r line
do
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] $line"
done
