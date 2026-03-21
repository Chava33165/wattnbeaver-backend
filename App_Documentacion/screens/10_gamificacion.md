# Pantalla de Gamificación

## 📄 Descripción
Sistema completo de logros, retos, puntos y ranking.

## 🎯 Objetivo
- Motivar al usuario a ahorrar energía/agua
- Mostrar progreso en logros
- Visualizar retos activos
- Comparar con otros usuarios (leaderboard)

## 🎨 Elementos Visuales

### Layout

```
┌─────────────────────────────────────┐
│  ← Gamificación                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ 👤 Tu Perfil de Jugador         ││
│  │                                 ││
│  │   Nivel 5    🏆 1,250 puntos   ││
│  │   [████████░░] 70% → Nivel 6   ││
│  │                                 ││
│  │   🔥 Racha: 12 días             ││
│  │   🎯 Mejor racha: 30 días       ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  📊 Tabs: [Logros] [Retos] [Ranking]│
├─────────────────────────────────────┤
│  ╔═════════════════════════════════╗│
│  ║ TAB: LOGROS                     ║│
│  ╚═════════════════════════════════╝│
│                                     │
│  Categorías: [Todo] [Energía] [Agua]│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ✅ 🎉 Primera Semana            ││
│  │    Completaste tu primera semana││
│  │    +100 puntos                  ││
│  │    Desbloqueado: 5 Feb 2026     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ⏳ 💰 Ahorrador Principiante    ││
│  │    Reduce consumo 10% en semana ││
│  │    Progress: 65% ████████░░     ││
│  │    +150 puntos al completar     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🔒 💎 Ahorrador Experto         ││
│  │    Reduce consumo 20% en semana ││
│  │    Requiere: Ahorrador Principi.││
│  │    +300 puntos                  ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 📑 Tabs

### 1. Tab: Logros (Achievements)

#### Estados de Logros
- **Desbloqueado** (✅): Verde, con fecha
- **En Progreso** (⏳): Azul, con barra de progreso
- **Bloqueado** (🔒): Gris, muestra requisitos

#### Card de Logro
```dart
Card(
  child: Row(
    children: [
      // Estado icon
      Icon(achievement.completed ? Icons.check_circle : Icons.lock),

      // Emoji del logro
      Text(achievement.icon, style: TextStyle(fontSize: 32)),

      // Info
      Column(
        children: [
          Text(achievement.name, style: bold),
          Text(achievement.description),
          if (!completed)
            LinearProgressIndicator(value: achievement.progress / 100),
          Text('+${achievement.points} puntos'),
        ]
      )
    ]
  )
)
```

### 2. Tab: Retos (Challenges)

```
┌─────────────────────────────────────┐
│  🎯 Retos Activos (2)               │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ ⚡ Reduce 15% esta semana       ││
│  │                                 ││
│  │ Progress: 45% ██████░░░░        ││
│  │ 6.75% / 15% completado          ││
│  │                                 ││
│  │ ⏱️ 3 días restantes              ││
│  │ 🏆 Recompensa: 200 puntos       ││
│  │                                 ││
│  │ [Ver Detalles]                  ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 💧 Ahorra 100 litros            ││
│  │                                 ││
│  │ Progress: 78% ████████░░        ││
│  │ 78L / 100L ahorrados            ││
│  │                                 ││
│  │ ⏱️ 5 días restantes              ││
│  │ 🏆 Recompensa: 150 puntos       ││
│  │                                 ││
│  │ [Ver Detalles]                  ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  💡 Retos Sugeridos                 │
│  [Tarjetas con nuevos retos]        │
└─────────────────────────────────────┘
```

### 3. Tab: Ranking (Leaderboard)

```
┌─────────────────────────────────────┐
│  🏆 Ranking Global                  │
│  Período: [Semana] [Mes] [Todo]     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ 🥇 1. María García              ││
│  │     Nivel 12 • 5,420 pts        ││
│  │     🔥 45 días de racha         ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🥈 2. Juan Pérez                ││
│  │     Nivel 10 • 4,130 pts        ││
│  │     🔥 30 días de racha         ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🥉 3. Carlos López              ││
│  │     Nivel 8 • 3,250 pts         ││
│  │     🔥 15 días de racha         ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🔷 8. Tú (Salvador)             ││
│  │     Nivel 5 • 1,250 pts         ││
│  │     🔥 12 días de racha         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 🌐 API Integration

### Endpoints

```dart
// Obtener datos de gamificación del usuario
GET /api/v1/gamification/me
Response:
{
  "success": true,
  "data": {
    "total_points": 1250,
    "current_level": 5,
    "current_streak": 12,
    "best_streak": 30,
    "points_to_next_level": 250,
    "next_level": 6
  }
}

// Obtener logros del usuario
GET /api/v1/gamification/achievements
Response:
{
  "success": true,
  "data": [
    {
      "id": "ach_first_week",
      "name": "Primera Semana",
      "description": "...",
      "icon": "🎉",
      "points": 100,
      "category": "milestone",
      "completed": true,
      "completed_at": "2026-02-05T12:00:00Z",
      "progress": 100
    }
  ]
}

// Obtener retos activos
GET /api/v1/gamification/challenges/active
Response:
{
  "success": true,
  "data": [
    {
      "id": "chal_123",
      "challenge_id": "chal_reduce_15",
      "name": "Reduce 15% esta semana",
      "type": "energy_reduction",
      "current_value": 6.75,
      "target_value": 15,
      "reward_points": 200,
      "status": "active",
      "days_remaining": 3
    }
  ]
}

// Leaderboard
GET /api/v1/gamification/leaderboard?period=week
Response:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "user-456",
        "name": "María García",
        "level": 12,
        "points": 5420,
        "streak": 45
      }
    ],
    "user_rank": {
      "rank": 8,
      "points": 1250
    }
  }
}
```

## 🎉 Animaciones

### Al Completar Logro
```dart
// Mostrar confetti animation
// Bottom sheet con logro desbloqueado
showModalBottomSheet(
  context: context,
  builder: (context) => AchievementUnlockedSheet(
    achievement: achievement,
    onClose: () {
      // Agregar puntos con animación
      _animatePointsIncrease(achievement.points);
    }
  )
);
```

### Al Subir de Nivel
```dart
// Fireworks animation
// Dialog con nueva insignia de nivel
showDialog(
  context: context,
  builder: (context) => LevelUpDialog(
    oldLevel: 5,
    newLevel: 6,
    rewards: ["Nuevo badge", "50 bonus points"]
  )
);
```

## 📱 State Management

```dart
class GamificationProvider extends ChangeNotifier {
  UserGamification? gamification;
  List<Achievement> achievements = [];
  List<Challenge> activeChallenges = [];
  Leaderboard? leaderboard;

  int get pointsToNextLevel =>
    (gamification!.currentLevel * 500) - gamification!.totalPoints;

  double get progressToNextLevel =>
    gamification!.totalPoints / (gamification!.currentLevel * 500);

  Future<void> loadGamification() async {
    final responses = await Future.wait([
      ApiService.getGamification(),
      ApiService.getAchievements(),
      ApiService.getActiveChallenges(),
      ApiService.getLeaderboard('week'),
    ]);

    gamification = responses[0].data;
    achievements = responses[1].data;
    activeChallenges = responses[2].data;
    leaderboard = responses[3].data;

    notifyListeners();
  }

  void checkAchievements() {
    // Verificar si se completó algún logro nuevo
    // Mostrar animación si es así
  }
}
```

## ✅ Criterios de Aceptación

- [ ] Muestra nivel y puntos correctamente
- [ ] Barra de progreso a siguiente nivel
- [ ] Logros se categorizan correctamente
- [ ] Muestra progreso en logros no completados
- [ ] Retos activos se actualizan en tiempo real
- [ ] Leaderboard ordena correctamente
- [ ] Animación al desbloquear logro
- [ ] Animación al subir de nivel
- [ ] Tabs funcionan correctamente
- [ ] Pull-to-refresh en todos los tabs

## 🎨 Sistema de Niveles

```dart
Level 1:    0 - 500 pts
Level 2:  500 - 1,000 pts
Level 3: 1,000 - 1,500 pts
...
Level N: (N-1)*500 - N*500 pts
```

## 🏆 Logros Predefinidos (desde BD)

1. 🎉 **Primera Semana** - 100 pts
2. 💰 **Ahorrador Principiante** (10% reducción) - 150 pts
3. 💎 **Ahorrador Experto** (20% reducción) - 300 pts
4. 🔥 **Racha de 7 días** - 200 pts
5. 🔥🔥 **Racha de 30 días** - 500 pts
6. 💧 **Sin Fugas** (30 días) - 250 pts

## 📝 Notas

- Considerar notificaciones push cuando se desbloquee logro
- Agregar share a redes sociales en v2.0
- Implementar badges/insignias visuales en v2.0
- Considerar sistema de recompensas físicas (descuentos) en v3.0
