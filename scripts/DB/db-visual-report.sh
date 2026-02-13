#!/bin/bash

DB="$HOME/wattnbeaber/backend/data/wattnbeaber.db"

echo "======================================"
echo "📊 REPORTE VISUAL DE BASE DE DATOS"
echo "======================================"
echo ""
echo "Fecha: $(date '+%d/%m/%Y %H:%M')"
echo ""

echo "📋 ESTRUCTURA DE TABLAS"
echo "======================================"
sqlite3 "$DB" ".schema" | grep "CREATE TABLE" | sed 's/CREATE TABLE /  ✓ /'
echo ""

echo "📊 REGISTROS POR TABLA"
echo "======================================"
for table in users devices energy_readings water_readings alerts user_gamification achievements user_achievements challenges user_challenges; do
    count=$(sqlite3 "$DB" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
    printf "  %-25s %6s registros\n" "$table:" "$count"
done
echo ""

echo "🔗 RELACIONES DETECTADAS"
echo "======================================"
echo "  users (1) ──→ (N) devices"
echo "  devices (1) ──→ (N) energy_readings"
echo "  devices (1) ──→ (N) water_readings"
echo "  users (1) ──→ (N) alerts"
echo "  users (1) ──→ (1) user_gamification"
echo "  users (1) ──→ (N) user_achievements"
echo "  achievements (1) ──→ (N) user_achievements"
echo "  users (1) ──→ (N) user_challenges"
echo "  challenges (1) ──→ (N) user_challenges"
echo ""

echo "💾 INFORMACIÓN DEL ARCHIVO"
echo "======================================"
echo "  Ubicación: $DB"
echo "  Tamaño: $(du -h "$DB" | cut -f1)"
echo "  Última modificación: $(stat -c %y "$DB" | cut -d'.' -f1)"
echo ""

echo "======================================"
