#!/bin/bash

DB_PATH="$HOME/wattnbeaber/backend/data/wattnbeaber.db"

echo "======================================"
echo "📊 EXPLORADOR DE BASE DE DATOS"
echo "======================================"
echo ""

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Base de datos no encontrada en: $DB_PATH"
    exit 1
fi

# Función para ejecutar query
query() {
    sqlite3 "$DB_PATH" "$1"
}

# Menú
while true; do
    echo ""
    echo "OPCIONES:"
    echo "1) Ver todas las tablas"
    echo "2) Ver usuarios"
    echo "3) Ver dispositivos"
    echo "4) Ver lecturas de energía (últimas 10)"
    echo "5) Ver lecturas de agua (últimas 10)"
    echo "6) Ver alertas"
    echo "7) Ver logros"
    echo "8) Ver gamificación"
    echo "9) Estadísticas generales"
    echo "10) Consulta personalizada"
    echo "11) Abrir sqlite3 interactivo"
    echo "0) Salir"
    echo ""
    read -p "Selecciona una opción: " option
    
    case $option in
        1)
            echo ""
            echo "📋 TABLAS:"
            query ".tables"
            ;;
        2)
            echo ""
            echo "👥 USUARIOS:"
            query "SELECT id, name, email, role, created_at FROM users;" | column -t -s '|'
            ;;
        3)
            echo ""
            echo "📱 DISPOSITIVOS:"
            query "SELECT device_id, device_name, device_type, location, status FROM devices;" | column -t -s '|'
            ;;
        4)
            echo ""
            echo "⚡ LECTURAS DE ENERGÍA (últimas 10):"
            query "SELECT device_id, power, voltage, current, energy, datetime(timestamp, 'localtime') as time FROM energy_readings ORDER BY timestamp DESC LIMIT 10;" | column -t -s '|'
            ;;
        5)
            echo ""
            echo "💧 LECTURAS DE AGUA (últimas 10):"
            query "SELECT device_id, flow, total, datetime(timestamp, 'localtime') as time FROM water_readings ORDER BY timestamp DESC LIMIT 10;" | column -t -s '|'
            ;;
        6)
            echo ""
            echo "🚨 ALERTAS:"
            query "SELECT type, severity, message, acknowledged, resolved, created_at FROM alerts ORDER BY created_at DESC LIMIT 10;" | column -t -s '|'
            ;;
        7)
            echo ""
            echo "🏆 LOGROS:"
            query "SELECT id, name, description, points, category FROM achievements;" | column -t -s '|'
            ;;
        8)
            echo ""
            echo "🎮 GAMIFICACIÓN:"
            query "SELECT u.name, g.total_points, g.current_level, g.current_streak, g.best_streak FROM user_gamification g JOIN users u ON g.user_id = u.id;" | column -t -s '|'
            ;;
        9)
            echo ""
            echo "📊 ESTADÍSTICAS:"
            echo ""
            echo "Usuarios: $(query 'SELECT COUNT(*) FROM users;')"
            echo "Dispositivos: $(query 'SELECT COUNT(*) FROM devices;')"
            echo "Lecturas Energía: $(query 'SELECT COUNT(*) FROM energy_readings;')"
            echo "Lecturas Agua: $(query 'SELECT COUNT(*) FROM water_readings;')"
            echo "Alertas: $(query 'SELECT COUNT(*) FROM alerts;')"
            echo "Logros: $(query 'SELECT COUNT(*) FROM achievements;')"
            echo ""
            echo "Tamaño DB: $(du -h $DB_PATH | cut -f1)"
            ;;
        10)
            echo ""
            read -p "Ingresa tu consulta SQL: " custom_query
            query "$custom_query" | column -t -s '|'
            ;;
        11)
            echo ""
            echo "Abriendo sqlite3 interactivo..."
            echo "Escribe .quit para salir"
            sqlite3 "$DB_PATH"
            ;;
        0)
            echo "👋 Saliendo..."
            exit 0
            ;;
        *)
            echo "❌ Opción inválida"
            ;;
    esac
done
