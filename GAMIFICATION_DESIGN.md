# 🎮 Diseño Completo del Sistema de Gamificación

**Este documento explica CÓMO quedará todo el sistema antes de implementar.**

---

## 📊 1. FLUJO COMPLETO DEL SISTEMA

### Cómo Funciona (Paso a Paso):

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DISPOSITIVO IoT ENVÍA DATOS                                  │
│    Raspberry Pi → MQTT → Backend                                │
│    Ejemplo: Consumo de energía: 120W                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND RECIBE Y GUARDA EN BASE DE DATOS                     │
│    • Guardar en energy_readings / water_readings                │
│    • Agregar a procesadores (buffer en memoria)                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GAMIFICATION PROCESSOR SE ACTIVA AUTOMÁTICAMENTE ⭐ NUEVO    │
│    • Calcular consumo del día vs ayer                           │
│    • Calcular consumo de la semana vs semana pasada             │
│    • Verificar si hay ahorro (10%, 15%, 20%)                    │
│    • Evaluar cada logro pendiente del usuario                   │
│    • Actualizar rachas                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ¿SE CUMPLIÓ ALGÚN LOGRO?                                     │
│    SI → Desbloquear logro                                       │
│         • Agregar puntos al usuario                             │
│         • Subir nivel si corresponde                            │
│         • Crear notificación                                    │
│         • Marcar logro como completed                           │
│    NO → Actualizar progreso (ej: "50% del camino")              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ACTUALIZAR RETOS ACTIVOS                                     │
│    • Usuario tiene reto "Reduce 15% esta semana"                │
│    • Calcular progreso actual (ej: 8% reducido)                 │
│    • Si alcanza 15% → Completar reto + puntos                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. APP FLUTTER CONSULTA ENDPOINTS                               │
│    GET /api/v1/gamification/profile                             │
│    Respuesta:                                                   │
│    {                                                            │
│      "user": { "name": "Juan", "avatar": "..." },              │
│      "level": 3,                                               │
│      "total_points": 450,                                      │
│      "current_streak": 5,                                      │
│      "rank": 2,                                                │
│      "achievements_unlocked": 3,                               │
│      "badges": ["🏆", "💰", "🔥"]                              │
│    }                                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. FLUTTER MUESTRA EN PANTALLA DE PERFIL                        │
│    • Avatar del usuario                                         │
│    • Nivel y barra de progreso                                  │
│    • Insignias desbloqueadas                                    │
│    • Ranking en leaderboard                                     │
│    • Notificaciones de nuevos logros                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏆 2. INSIGNIAS Y RECOMPENSAS

### 📁 Dónde Guardar las Insignias (Imágenes)

#### Opción 1: En el Backend (Recomendado para empezar)

```
wattnbeaber/backend/
└── public/
    └── badges/
        ├── first_week.png          (🏆 Primera Semana)
        ├── saver_beginner.png      (💰 Ahorrador Principiante)
        ├── saver_expert.png        (💎 Ahorrador Experto)
        ├── streak_7.png            (🔥 Racha 7 días)
        ├── streak_30.png           (🔥🔥 Racha 30 días)
        ├── no_leak.png             (💧 Sin Fugas)
        ├── eco_warrior.png         (🌱 Guerrero Ecológico)
        └── master_saver.png        (👑 Maestro del Ahorro)
```

**URL en API:**
```
http://tu-servidor:3000/badges/first_week.png
```

#### Opción 2: URLs Externas (Iconos de Internet)

Usar servicios gratuitos como:
- **Flaticon**: https://www.flaticon.com/
- **Icons8**: https://icons8.com/
- **Font Awesome**: https://fontawesome.com/icons

Guardar solo la URL en la base de datos.

#### Opción 3: Emojis (Más Simple para Empezar) ⭐ RECOMENDADO

```javascript
{
  "ach_first_week": {
    "icon": "🏆",
    "color": "#FFD700"
  },
  "ach_save_10": {
    "icon": "💰",
    "color": "#4CAF50"
  },
  "ach_save_20": {
    "icon": "💎",
    "color": "#2196F3"
  }
}
```

**Ventajas:**
- ✅ No necesitas imágenes
- ✅ Se ven igual en todas las plataformas
- ✅ Flutter tiene soporte nativo para emojis
- ✅ Fácil de cambiar

---

## 🗄️ 3. ESTRUCTURA DE BASE DE DATOS

### Cambios Necesarios en la BD:

#### A) Agregar columna `icon` a tabla `achievements`

```sql
-- Ya existe:
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,              -- ⬅️ Ya existe pero usaremos mejor
  points INTEGER DEFAULT 0,
  category TEXT,
  requirement TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Actualizar los logros existentes:
UPDATE achievements SET icon = '🏆' WHERE id = 'ach_first_week';
UPDATE achievements SET icon = '💰' WHERE id = 'ach_save_10';
UPDATE achievements SET icon = '💎' WHERE id = 'ach_save_20';
UPDATE achievements SET icon = '🔥' WHERE id = 'ach_streak_7';
UPDATE achievements SET icon = '🔥🔥' WHERE id = 'ach_streak_30';
UPDATE achievements SET icon = '💧' WHERE id = 'ach_no_leak';
```

#### B) Agregar columna `color` (opcional pero bonito)

```sql
ALTER TABLE achievements ADD COLUMN color TEXT DEFAULT '#4CAF50';

-- Asignar colores:
UPDATE achievements SET color = '#FFD700' WHERE id = 'ach_first_week';  -- Dorado
UPDATE achievements SET color = '#4CAF50' WHERE id = 'ach_save_10';     -- Verde
UPDATE achievements SET color = '#2196F3' WHERE id = 'ach_save_20';     -- Azul
UPDATE achievements SET color = '#FF5722' WHERE id = 'ach_streak_7';    -- Naranja
UPDATE achievements SET color = '#9C27B0' WHERE id = 'ach_streak_30';   -- Morado
UPDATE achievements SET color = '#00BCD4' WHERE id = 'ach_no_leak';     -- Cyan
```

#### C) Nueva tabla `notifications` (Para Flutter)

```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'achievement', 'challenge', 'streak', 'level_up'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,                    -- JSON con info adicional
  icon TEXT,                    -- Emoji o URL de icono
  read INTEGER DEFAULT 0,       -- 0 = no leído, 1 = leído
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at);
```

---

## 📂 4. ARCHIVOS QUE SE CREARÁN/MODIFICARÁN

### ✨ Archivos NUEVOS a Crear:

```
backend/src/
├── processors/
│   └── gamification/
│       ├── GamificationProcessor.js     ⭐ NUEVO - Motor principal
│       ├── AchievementEvaluator.js      ⭐ NUEVO - Evalúa logros
│       ├── ChallengeEvaluator.js        ⭐ NUEVO - Evalúa retos
│       └── StreakCalculator.js          ⭐ NUEVO - Calcula rachas
│
├── models/
│   └── Notification.js                  ⭐ NUEVO - Modelo de notificaciones
│
└── utils/
    └── badgeIcons.js                    ⭐ NUEVO - Mapeo de iconos
```

### 🔧 Archivos EXISTENTES a Modificar:

```
backend/src/
├── models/
│   └── Gamification.js                  🔧 Agregar métodos de evaluación
│
├── services/
│   ├── mqttService.js                   🔧 Trigger gamification al recibir datos
│   └── database.js                      🔧 Agregar tabla notifications
│
├── controllers/
│   ├── gamification/
│   │   └── gamificationController.js    🔧 Agregar endpoint de badges
│   └── notifications/
│       └── notificationController.js    🔧 Endpoints de notificaciones
│
└── routes/
    └── api/
        ├── gamificationRoutes.js        🔧 Nueva ruta /badges
        └── notificationRoutes.js        🔧 Rutas de notificaciones
```

---

## 🎯 5. ENDPOINTS PARA FLUTTER

### A) Perfil de Gamificación (Optimizado)

```javascript
GET /api/v1/gamification/profile
Authorization: Bearer <token>

// Respuesta:
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "avatar": null  // URL si tiene avatar
    },
    "gamification": {
      "level": 3,
      "total_points": 450,
      "points_to_next_level": 150,  // Faltan 150 para nivel 4
      "progress_percent": 75,        // 75% hacia el siguiente nivel
      "current_streak": 5,
      "best_streak": 7,
      "rank": 2,                     // Posición en leaderboard
      "total_users": 10              // De 10 usuarios totales
    },
    "badges": [
      {
        "id": "ach_first_week",
        "name": "Primera Semana",
        "icon": "🏆",
        "color": "#FFD700",
        "unlocked": true,
        "unlocked_at": "2026-01-22T10:30:00Z"
      },
      {
        "id": "ach_save_10",
        "name": "Ahorrador Principiante",
        "icon": "💰",
        "color": "#4CAF50",
        "unlocked": true,
        "unlocked_at": "2026-02-01T15:20:00Z"
      },
      {
        "id": "ach_save_20",
        "name": "Ahorrador Experto",
        "icon": "💎",
        "color": "#2196F3",
        "unlocked": false,  // Bloqueado
        "progress": 60      // 60% del camino
      }
    ],
    "active_challenges": [
      {
        "id": "chal_reduce_15",
        "name": "Reduce 15% esta semana",
        "icon": "⚡",
        "current_value": 8.5,
        "target_value": 15.0,
        "progress_percent": 57,
        "reward_points": 200,
        "days_left": 3,
        "end_date": "2026-02-16T00:00:00Z"
      }
    ],
    "recent_achievements": [
      {
        "achievement": "Ahorrador Principiante",
        "icon": "💰",
        "points_earned": 150,
        "unlocked_at": "2026-02-01T15:20:00Z",
        "is_new": true  // Para mostrar badge "NEW"
      }
    ]
  }
}
```

### B) Lista de Logros

```javascript
GET /api/v1/gamification/achievements

{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "ach_first_week",
        "name": "Primera Semana",
        "description": "Completa tu primera semana usando WattBeaber",
        "icon": "🏆",
        "color": "#FFD700",
        "points": 100,
        "category": "milestone",
        "unlocked": true,
        "completed_at": "2026-01-22T10:30:00Z"
      },
      {
        "id": "ach_save_10",
        "name": "Ahorrador Principiante",
        "description": "Reduce tu consumo 10% en una semana",
        "icon": "💰",
        "color": "#4CAF50",
        "points": 150,
        "category": "saving",
        "unlocked": true,
        "completed_at": "2026-02-01T15:20:00Z"
      },
      {
        "id": "ach_save_20",
        "name": "Ahorrador Experto",
        "description": "Reduce tu consumo 20% en una semana",
        "icon": "💎",
        "color": "#2196F3",
        "points": 300,
        "category": "saving",
        "unlocked": false,
        "progress": 60,
        "requirement": "Ahorra 20% de energía"
      }
    ],
    "summary": {
      "total": 6,
      "unlocked": 2,
      "locked": 4,
      "progress_percent": 33
    }
  }
}
```

### C) Notificaciones (Para Mostrar "Nuevo Logro")

```javascript
GET /api/v1/notifications?unread=true

{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "achievement",
        "title": "¡Nuevo Logro Desbloqueado!",
        "message": "Has conseguido: Ahorrador Principiante 💰",
        "icon": "💰",
        "data": {
          "achievement_id": "ach_save_10",
          "points_earned": 150
        },
        "read": false,
        "created_at": "2026-02-01T15:20:00Z"
      },
      {
        "id": "notif_124",
        "type": "level_up",
        "title": "¡Subiste de Nivel!",
        "message": "Ahora eres Nivel 3 🎉",
        "icon": "⬆️",
        "data": {
          "new_level": 3,
          "total_points": 450
        },
        "read": false,
        "created_at": "2026-02-01T15:21:00Z"
      }
    ],
    "unread_count": 2
  }
}
```

### D) Leaderboard

```javascript
GET /api/v1/gamification/leaderboard?limit=10

{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user456",
          "name": "María García",
          "avatar": null
        },
        "level": 5,
        "total_points": 850,
        "badges_count": 4,
        "current_streak": 12
      },
      {
        "rank": 2,
        "user": {
          "id": "user123",
          "name": "Juan Pérez",
          "avatar": null
        },
        "level": 3,
        "total_points": 450,
        "badges_count": 2,
        "current_streak": 5,
        "is_current_user": true  // Para destacar en UI
      }
    ],
    "current_user_rank": {
      "rank": 2,
      "total_users": 10
    }
  }
}
```

---

## 🎨 6. EJEMPLOS VISUALES EN FLUTTER

### Pantalla de Perfil en Flutter:

```
┌────────────────────────────────────────┐
│  ← Perfil                     ⚙️       │
├────────────────────────────────────────┤
│                                        │
│         👤 Juan Pérez                  │
│                                        │
│         Nivel 3 ⭐⭐⭐                   │
│    [████████░░] 75% → Nivel 4          │
│                                        │
│    💯 450 puntos  🏆 2/6  🔥 5 días    │
│                                        │
├────────────────────────────────────────┤
│  Insignias Desbloqueadas               │
├────────────────────────────────────────┤
│                                        │
│   ┌──────┐  ┌──────┐  ┌──────┐        │
│   │  🏆  │  │  💰  │  │  🔒  │        │
│   │Primer│  │Ahorr.│  │      │        │
│   │Semana│  │Princ.│  │ 60%  │        │
│   └──────┘  └──────┘  └──────┘        │
│                                        │
│   ┌──────┐  ┌──────┐  ┌──────┐        │
│   │  🔒  │  │  🔒  │  │  🔒  │        │
│   │      │  │      │  │      │        │
│   │      │  │      │  │      │        │
│   └──────┘  └──────┘  └──────┘        │
│                                        │
├────────────────────────────────────────┤
│  Retos Activos                         │
├────────────────────────────────────────┤
│                                        │
│  ⚡ Reduce 15% esta semana             │
│  [█████████░░░] 57% (8.5/15)           │
│  🎁 200 puntos · ⏰ 3 días              │
│                                        │
├────────────────────────────────────────┤
│  Ranking                               │
├────────────────────────────────────────┤
│                                        │
│  🥇 María García     850 pts           │
│  🥈 Juan Pérez (Tú)  450 pts ◀         │
│  🥉 Pedro López      320 pts           │
│                                        │
└────────────────────────────────────────┘
```

### Notificación Emergente:

```
┌────────────────────────────────────────┐
│  🎉 ¡Nuevo Logro!                      │
│                                        │
│           💰                           │
│     Ahorrador Principiante             │
│                                        │
│  Has reducido tu consumo en 10%        │
│                                        │
│       +150 puntos 🎯                   │
│                                        │
│  [     Ver Detalles     ]              │
└────────────────────────────────────────┘
```

---

## 🔄 7. FLUJO DE EVALUACIÓN AUTOMÁTICA

### Cuándo se Evalúan los Logros:

```javascript
// Triggers (Disparadores):

1. CADA VEZ que llega una lectura MQTT
   → Evaluar logros en tiempo real

2. CRON JOB cada medianoche (00:00)
   → Evaluar logros diarios/semanales
   → Actualizar rachas

3. Cuando el usuario INICIA UN RETO
   → Evaluar progreso inmediatamente

4. Cuando se llama al endpoint /evaluate (manual)
   → Para debug o forzar evaluación
```

### Lógica de Evaluación:

```javascript
// Ejemplo: Logro "Ahorrador Principiante" (10% reducción)

function evaluateAchievementSave10(userId) {
  // 1. Obtener consumo de esta semana
  const currentWeek = getConsumption(userId, 'this_week');

  // 2. Obtener consumo de semana pasada
  const lastWeek = getConsumption(userId, 'last_week');

  // 3. Calcular reducción
  const reduction = ((lastWeek - currentWeek) / lastWeek) * 100;

  // 4. ¿Cumple el objetivo?
  if (reduction >= 10) {
    // SÍ: Desbloquear logro
    unlockAchievement(userId, 'ach_save_10');
    addPoints(userId, 150);
    createNotification(userId, {
      type: 'achievement',
      title: '¡Nuevo Logro!',
      message: 'Ahorrador Principiante 💰',
      icon: '💰',
      data: { achievement_id: 'ach_save_10' }
    });
  } else {
    // NO: Actualizar progreso
    updateAchievementProgress(userId, 'ach_save_10', reduction * 10);
  }
}
```

---

## 📋 8. RESUMEN DE CAMBIOS

### Lo que se Agregará:

✅ **4 nuevos archivos** de procesadores
✅ **1 nuevo modelo** (Notification)
✅ **Modificaciones** en 6 archivos existentes
✅ **Nueva tabla** en base de datos
✅ **Columnas nuevas** en tabla achievements
✅ **5 endpoints nuevos** para Flutter
✅ **Sistema de notificaciones** completo

### Lo que NO se Tocará:

✅ Tus lecturas actuales (energy_readings, water_readings)
✅ Sistema de autenticación
✅ Endpoints existentes
✅ Configuración de MQTT
✅ Procesadores de energía/agua

---

## 🎯 9. BENEFICIOS PARA FLUTTER

### Lo que Flutter Podrá Hacer:

✅ **Mostrar perfil con insignias**
   - Badges desbloqueados con colores
   - Badges bloqueados con progreso

✅ **Notificaciones push**
   - Cuando se desbloquea logro
   - Cuando sube de nivel
   - Cuando completa reto

✅ **Animaciones**
   - Confeti cuando desbloquea logro
   - Barra de progreso animada
   - Badge que "brilla" cuando es nuevo

✅ **Leaderboard interactivo**
   - Ver top 10 usuarios
   - Destacar posición del usuario
   - Comparar stats

✅ **Gamificación visual**
   - Usar emojis directamente
   - O descargar imágenes de badges
   - Colores personalizados por categoría

---

## 💡 10. RECOMENDACIONES PARA INSIGNIAS

### Opción A: Emojis (Empezar con esto)

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No necesitas diseñar nada
- ✅ Se ve igual en todas las plataformas
- ✅ Fácil de cambiar

**Código Flutter:**
```dart
Text(
  achievement.icon,  // "🏆"
  style: TextStyle(fontSize: 48)
)
```

### Opción B: Imágenes PNG (Futuro)

**Cuando tengas tiempo:**
- Diseñar en Figma/Canva
- Exportar como PNG (512x512)
- Guardar en `backend/public/badges/`
- Actualizar URL en base de datos

**Código Flutter:**
```dart
Image.network(
  'http://tu-servidor:3000/badges/first_week.png',
  width: 64,
  height: 64,
)
```

### Opción C: Iconos de Paquetes Flutter

**Usar paquetes como:**
- `flutter_icons`
- `font_awesome_flutter`
- `line_icons`

---

## ✅ SIGUIENTE PASO

Ahora que entiendes cómo funcionará todo:

1. **¿Te gusta este diseño?**
2. **¿Quieres cambiar algo?**
3. **¿Empezamos con emojis o prefieres imágenes?**

Cuando me des el OK, crearemos una **rama Git** nueva y empezaremos a implementar todo esto sin tocar `main`.

---

**Creado:** Febrero 2026
**Proyecto:** WattBeaber
**Pendiente:** Aprobación para implementar
