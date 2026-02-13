#!/bin/bash
# Monitor de MQTT en tiempo real

echo "🔍 Monitoreando MQTT - WattBeaber"
echo "=================================="
echo "Presiona Ctrl+C para salir"
echo ""

mosquitto_sub -h localhost -t "wattnbeaber/#" -v -u mqtt_user -P watt
