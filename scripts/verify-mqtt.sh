#!/bin/bash

echo "======================================"
echo "🔍 VERIFICACIÓN MQTT - WattBeaber"
echo "======================================"
echo ""

echo "📦 MOSQUITTO:"
echo "-------------"
mosquitto -h 2>&1 | head -3
echo ""

echo "🔄 SERVICIO:"
echo "------------"
sudo systemctl status mosquitto | grep "Active:"
echo ""

echo "🔌 PUERTO 1883:"
echo "---------------"
sudo netstat -tuln | grep 1883 || ss -tuln | grep 1883
echo ""

echo "👥 USUARIOS MQTT:"
echo "-----------------"
echo "Usuarios configurados:"
sudo cat /etc/mosquitto/passwd | cut -d: -f1
echo ""

echo "📁 ARCHIVOS CONFIG:"
echo "-------------------"
echo "✅ /etc/mosquitto/conf.d/wattnbeaber.conf"
ls -lh /etc/mosquitto/conf.d/wattnbeaber.conf
echo "✅ /etc/mosquitto/passwd"
ls -lh /etc/mosquitto/passwd
echo "✅ /etc/mosquitto/acl (opcional)"
ls -lh /etc/mosquitto/acl 2>/dev/null || echo "   No configurado (opcional)"
echo ""

echo "📊 LOGS:"
echo "--------"
echo "Últimas 5 líneas del log:"
sudo tail -5 /var/log/mosquitto/mosquitto.log
echo ""

echo "🧪 TEST DE CONEXIÓN:"
echo "--------------------"
echo "Probando conexión sin autenticación (debe fallar):"
timeout 2 mosquitto_pub -h localhost -t "test" -m "test" 2>&1 | grep -i "not authorised" && echo "✅ Autenticación funcionando" || echo "⚠️  Verificar configuración"
echo ""

echo "Probando conexión con autenticación:"
echo "Usuario: mqtt_user"
timeout 2 mosquitto_pub -h localhost -t "wattnbeaber/test" -m "test auth" -u mqtt_user -P watt && echo "✅ Autenticación OK" || echo "❌ Error de autenticación"
echo ""

echo "✅ VERIFICACIÓN COMPLETA"
echo "======================================"
