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
    echo "7) Ver logros disponibles"
    echo "8) Ver perfil de gamificación (resumen)"
    echo "9) Ver logros por usuario (detallado) 🆕"
    echo "10) Ver retos por usuario 🆕"
    echo "11) Ver notificaciones 🆕"
    echo "12) Ver leaderboard (ranking) 🆕"
    echo "13) Estadísticas generales"
    echo "14) Consulta personalizada"
    echo "15) Abrir sqlite3 interactivo"
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
            echo "🏆 LOGROS DISPONIBLES EN EL SISTEMA:"
            echo ""
            query "SELECT icon || ' ' || name as Logro, description as Descripción, points as Puntos, color as Color, category as Categoría FROM achievements ORDER BY points;" | column -t -s '|'
            ;;
        8)
            echo ""
            echo "🎮 PERFIL DE GAMIFICACIÓN (Resumen):"
            echo ""
            echo "Esta opción muestra el resumen de gamificación de cada usuario:"
            echo "- Nombre del usuario"
            echo "- Puntos totales acumulados"
            echo "- Nivel actual (basado en puntos)"
            echo "- Racha actual (días consecutivos cumpliendo objetivo)"
            echo "- Mejor racha histórica"
            echo ""
            query "SELECT
                u.name as Usuario,
                g.total_points as Puntos,
                g.current_level as Nivel,
                g.current_streak as 'Racha Actual',
                g.best_streak as 'Mejor Racha'
            FROM user_gamification g
            JOIN users u ON g.user_id = u.id
            ORDER BY g.total_points DESC;" | column -t -s '|'
            ;;
        9)
            echo ""
            echo "🏆 LOGROS POR USUARIO (Detallado):"
            echo ""

            # Listar usuarios
            echo "Usuarios disponibles:"
            query "SELECT ROW_NUMBER() OVER (ORDER BY name) as num, id, name FROM users;" | column -t -s '|'
            echo ""
            read -p "Ingresa el ID del usuario (o Enter para ver todos): " user_id

            if [ -z "$user_id" ]; then
                # Mostrar todos los usuarios con sus logros
                echo ""
                echo "📊 RESUMEN DE LOGROS POR USUARIO:"
                echo ""

                users=$(query "SELECT id FROM users;")
                for uid in $users; do
                    user_name=$(query "SELECT name FROM users WHERE id='$uid';")
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "👤 Usuario: $user_name (ID: $uid)"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                    # Contar logros
                    completed=$(query "SELECT COUNT(*) FROM user_achievements WHERE user_id='$uid' AND completed=1;")
                    total=$(query "SELECT COUNT(*) FROM achievements;")

                    echo "✅ Logros completados: $completed/$total"
                    echo ""

                    # Logros completados
                    echo "🏆 Logros Desbloqueados:"
                    query "SELECT
                        a.icon || ' ' || a.name as Logro,
                        a.points as Puntos,
                        datetime(ua.completed_at, 'localtime') as 'Fecha Completado'
                    FROM user_achievements ua
                    JOIN achievements a ON ua.achievement_id = a.id
                    WHERE ua.user_id='$uid' AND ua.completed=1
                    ORDER BY ua.completed_at DESC;" | column -t -s '|'

                    if [ "$completed" -eq 0 ]; then
                        echo "   (Ninguno)"
                    fi

                    echo ""
                    echo "🔄 Logros en Progreso:"
                    query "SELECT
                        a.icon || ' ' || a.name as Logro,
                        ua.progress || '%' as Progreso,
                        a.points as 'Puntos al Completar'
                    FROM user_achievements ua
                    JOIN achievements a ON ua.achievement_id = a.id
                    WHERE ua.user_id='$uid' AND ua.completed=0 AND ua.progress > 0
                    ORDER BY ua.progress DESC;" | column -t -s '|'

                    in_progress=$(query "SELECT COUNT(*) FROM user_achievements WHERE user_id='$uid' AND completed=0 AND progress > 0;")
                    if [ "$in_progress" -eq 0 ]; then
                        echo "   (Ninguno)"
                    fi

                    echo ""
                done
            else
                # Mostrar logros de un usuario específico
                user_name=$(query "SELECT name FROM users WHERE id='$user_id';")

                if [ -z "$user_name" ]; then
                    echo "❌ Usuario no encontrado"
                else
                    echo ""
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "👤 Usuario: $user_name"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                    # Perfil
                    echo ""
                    echo "📊 Perfil de Gamificación:"
                    query "SELECT
                        'Nivel: ' || current_level || ' | Puntos: ' || total_points || ' | Racha: ' || current_streak || ' días (Mejor: ' || best_streak || ')' as Perfil
                    FROM user_gamification WHERE user_id='$user_id';" | column -t -s '|'

                    echo ""
                    echo "🏆 Logros Desbloqueados:"
                    query "SELECT
                        a.icon || ' ' || a.name as Logro,
                        a.description as Descripción,
                        '+' || a.points || ' pts' as Puntos,
                        datetime(ua.completed_at, 'localtime') as Completado
                    FROM user_achievements ua
                    JOIN achievements a ON ua.achievement_id = a.id
                    WHERE ua.user_id='$user_id' AND ua.completed=1
                    ORDER BY ua.completed_at DESC;" | column -t -s '|'

                    echo ""
                    echo "🔄 Logros en Progreso:"
                    query "SELECT
                        a.icon || ' ' || a.name as Logro,
                        ua.progress || '%' as Progreso,
                        a.requirement as Requisito
                    FROM user_achievements ua
                    JOIN achievements a ON ua.achievement_id = a.id
                    WHERE ua.user_id='$user_id' AND ua.completed=0 AND ua.progress > 0
                    ORDER BY ua.progress DESC;" | column -t -s '|'

                    echo ""
                    echo "🔒 Logros Bloqueados:"
                    query "SELECT
                        a.icon || ' ' || a.name as Logro,
                        a.description as Descripción,
                        a.requirement as Requisito,
                        a.points as Puntos
                    FROM achievements a
                    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id='$user_id'
                    WHERE ua.id IS NULL OR (ua.completed=0 AND (ua.progress IS NULL OR ua.progress = 0))
                    ORDER BY a.points;" | column -t -s '|'
                fi
            fi
            ;;
        10)
            echo ""
            echo "🎯 RETOS POR USUARIO:"
            echo ""

            # Listar usuarios
            echo "Usuarios disponibles:"
            query "SELECT ROW_NUMBER() OVER (ORDER BY name) as num, id, name FROM users;" | column -t -s '|'
            echo ""
            read -p "Ingresa el ID del usuario: " user_id

            if [ -z "$user_id" ]; then
                echo "❌ ID requerido"
            else
                user_name=$(query "SELECT name FROM users WHERE id='$user_id';")

                if [ -z "$user_name" ]; then
                    echo "❌ Usuario no encontrado"
                else
                    echo ""
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "👤 Usuario: $user_name"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                    echo ""
                    echo "🔄 Retos Activos:"
                    query "SELECT
                        c.name as Reto,
                        c.description as Descripción,
                        ROUND((uc.current_value * 100.0 / uc.target_value), 1) || '%' as Progreso,
                        uc.current_value || '/' || uc.target_value as Valor,
                        '+' || c.reward_points || ' pts' as Recompensa,
                        date(uc.end_date) as 'Fecha Límite'
                    FROM user_challenges uc
                    JOIN challenges c ON uc.challenge_id = c.id
                    WHERE uc.user_id='$user_id' AND uc.status='active'
                    ORDER BY uc.end_date;" | column -t -s '|'

                    echo ""
                    echo "✅ Retos Completados:"
                    query "SELECT
                        c.name as Reto,
                        '+' || c.reward_points || ' pts' as 'Puntos Ganados',
                        datetime(uc.completed_at, 'localtime') as Completado
                    FROM user_challenges uc
                    JOIN challenges c ON uc.challenge_id = c.id
                    WHERE uc.user_id='$user_id' AND uc.status='completed'
                    ORDER BY uc.completed_at DESC
                    LIMIT 10;" | column -t -s '|'
                fi
            fi
            ;;
        11)
            echo ""
            echo "📬 NOTIFICACIONES:"
            echo ""

            # Listar usuarios
            echo "Usuarios disponibles:"
            query "SELECT ROW_NUMBER() OVER (ORDER BY name) as num, id, name FROM users;" | column -t -s '|'
            echo ""
            read -p "Ingresa el ID del usuario (o Enter para ver todas): " user_id

            if [ -z "$user_id" ]; then
                echo ""
                echo "📬 Últimas 20 Notificaciones (Todos los Usuarios):"
                query "SELECT
                    u.name as Usuario,
                    n.icon || ' ' || n.title as Notificación,
                    n.message as Mensaje,
                    CASE WHEN n.read=1 THEN '✓' ELSE '●' END as Estado,
                    datetime(n.created_at, 'localtime') as Fecha
                FROM notifications n
                JOIN users u ON n.user_id = u.id
                ORDER BY n.created_at DESC
                LIMIT 20;" | column -t -s '|'
            else
                user_name=$(query "SELECT name FROM users WHERE id='$user_id';")

                if [ -z "$user_name" ]; then
                    echo "❌ Usuario no encontrado"
                else
                    echo ""
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "👤 Usuario: $user_name"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                    unread=$(query "SELECT COUNT(*) FROM notifications WHERE user_id='$user_id' AND read=0;")
                    total=$(query "SELECT COUNT(*) FROM notifications WHERE user_id='$user_id';")

                    echo ""
                    echo "📊 Total: $total notificaciones | No leídas: $unread"
                    echo ""

                    query "SELECT
                        n.icon || ' ' || n.title as Notificación,
                        n.message as Mensaje,
                        n.type as Tipo,
                        CASE WHEN n.read=1 THEN 'Leída' ELSE 'NO LEÍDA' END as Estado,
                        datetime(n.created_at, 'localtime') as Fecha
                    FROM notifications n
                    WHERE n.user_id='$user_id'
                    ORDER BY n.created_at DESC
                    LIMIT 20;" | column -t -s '|'
                fi
            fi
            ;;
        12)
            echo ""
            echo "🏅 LEADERBOARD (Ranking de Usuarios):"
            echo ""

            read -p "¿Cuántos usuarios mostrar? (default 10): " limit
            limit=${limit:-10}

            echo ""
            echo "Top $limit usuarios por puntos:"
            echo ""

            query "SELECT
                ROW_NUMBER() OVER (ORDER BY g.total_points DESC) as '#',
                CASE
                    WHEN ROW_NUMBER() OVER (ORDER BY g.total_points DESC) = 1 THEN '🥇'
                    WHEN ROW_NUMBER() OVER (ORDER BY g.total_points DESC) = 2 THEN '🥈'
                    WHEN ROW_NUMBER() OVER (ORDER BY g.total_points DESC) = 3 THEN '🥉'
                    ELSE '  '
                END as Medal,
                u.name as Usuario,
                g.total_points as Puntos,
                'Nivel ' || g.current_level as Nivel,
                g.current_streak || ' días' as Racha
            FROM user_gamification g
            JOIN users u ON g.user_id = u.id
            ORDER BY g.total_points DESC
            LIMIT $limit;" | column -t -s '|'
            ;;
        13)
            echo ""
            echo "📊 ESTADÍSTICAS GENERALES:"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "👥 USUARIOS Y DISPOSITIVOS:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "   Usuarios: $(query 'SELECT COUNT(*) FROM users;')"
            echo "   Dispositivos: $(query 'SELECT COUNT(*) FROM devices;')"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📊 LECTURAS:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "   Lecturas de Energía: $(query 'SELECT COUNT(*) FROM energy_readings;')"
            echo "   Lecturas de Agua: $(query 'SELECT COUNT(*) FROM water_readings;')"
            echo "   Alertas: $(query 'SELECT COUNT(*) FROM alerts;')"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎮 GAMIFICACIÓN:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "   Logros en el sistema: $(query 'SELECT COUNT(*) FROM achievements;')"
            echo "   Logros desbloqueados: $(query 'SELECT COUNT(*) FROM user_achievements WHERE completed=1;')"
            echo "   Retos activos: $(query 'SELECT COUNT(*) FROM user_challenges WHERE status=\"active\";')"
            echo "   Retos completados: $(query 'SELECT COUNT(*) FROM user_challenges WHERE status=\"completed\";')"
            echo "   Notificaciones: $(query 'SELECT COUNT(*) FROM notifications;')"
            echo "   Notificaciones no leídas: $(query 'SELECT COUNT(*) FROM notifications WHERE read=0;')"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "💾 BASE DE DATOS:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "   Tamaño: $(du -h $DB_PATH | cut -f1)"
            echo "   Ubicación: $DB_PATH"
            echo ""
            ;;
        14)
            echo ""
            read -p "Ingresa tu consulta SQL: " custom_query
            query "$custom_query" | column -t -s '|'
            ;;
        15)
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
