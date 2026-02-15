# Design System - Estilo Apple Health/Fitness

## 🎨 Filosofía de Diseño

Inspirado en Apple Health y Apple Fitness, el diseño de WattBeaber debe ser:

- **Clean & Minimal**: Espacios en blanco generosos, sin clutter
- **Data-Driven**: Los números grandes son protagonistas
- **Colorful**: Usa colores vibrantes pero con propósito
- **Smooth**: Animaciones fluidas y naturales
- **Accessible**: Alto contraste, textos legibles

---

## 🎯 Colores Principales

### Paleta Base

```dart
// core/constants/app_colors.dart

class AppColors {
  // === COLORES PRIMARIOS ===

  // Verde (Energía) - Inspirado en Apple Activity Green
  static const Color energyPrimary = Color(0xFF34C759);      // Verde brillante
  static const Color energyLight = Color(0xFF8FE09F);        // Verde claro
  static const Color energyDark = Color(0xFF248A3D);         // Verde oscuro

  // Azul (Agua) - Inspirado en Apple Fitness Blue
  static const Color waterPrimary = Color(0xFF007AFF);       // Azul iOS
  static const Color waterLight = Color(0xFF5AC8FA);         // Azul claro
  static const Color waterDark = Color(0xFF0051D5);          // Azul oscuro

  // === COLORES SECUNDARIOS ===

  // Amarillo/Naranja (Alertas, Metas)
  static const Color accentOrange = Color(0xFFFF9500);       // Naranja
  static const Color accentYellow = Color(0xFFFFCC00);       // Amarillo

  // Rojo (Alertas Críticas)
  static const Color alertRed = Color(0xFFFF3B30);           // Rojo

  // Púrpura (Gamificación)
  static const Color gamificationPurple = Color(0xFFAF52DE); // Púrpura

  // === COLORES NEUTRALES ===

  // Backgrounds (Light Mode)
  static const Color backgroundPrimary = Color(0xFFFFFFFF);   // Blanco
  static const Color backgroundSecondary = Color(0xFFF2F2F7); // Gris muy claro
  static const Color backgroundTertiary = Color(0xFFE5E5EA);  // Gris claro

  // Backgrounds (Dark Mode)
  static const Color backgroundDarkPrimary = Color(0xFF000000);   // Negro
  static const Color backgroundDarkSecondary = Color(0xFF1C1C1E); // Gris oscuro
  static const Color backgroundDarkTertiary = Color(0xFF2C2C2E);  // Gris medio

  // Text Colors
  static const Color textPrimary = Color(0xFF000000);         // Negro
  static const Color textSecondary = Color(0xFF3C3C43);       // Gris oscuro
  static const Color textTertiary = Color(0xFF8E8E93);        // Gris medio

  // Text Colors (Dark Mode)
  static const Color textDarkPrimary = Color(0xFFFFFFFF);     // Blanco
  static const Color textDarkSecondary = Color(0xFFEBEBF5);   // Gris claro
  static const Color textDarkTertiary = Color(0xFF8E8E93);    // Gris

  // === GRADIENTES ===

  // Gradiente Energía
  static const List<Color> energyGradient = [
    Color(0xFF34C759),  // Verde brillante
    Color(0xFF30D158),  // Verde más claro
  ];

  // Gradiente Agua
  static const List<Color> waterGradient = [
    Color(0xFF007AFF),  // Azul
    Color(0xFF5AC8FA),  // Azul claro
  ];

  // Gradiente Gamificación
  static const List<Color> gamificationGradient = [
    Color(0xFFAF52DE),  // Púrpura
    Color(0xFFFF2D55),  // Rosa
  ];
}
```

---

## 📐 Typography

### Fuentes

```dart
// core/theme/text_styles.dart

class AppTextStyles {
  // San Francisco (iOS) / Roboto (Android)
  static const String fontFamily = 'SF Pro Display';

  // === HEADERS ===

  // Large Title (34pt - iOS style)
  static const TextStyle largeTitle = TextStyle(
    fontSize: 34,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.37,
    height: 1.15,
  );

  // Title 1 (28pt)
  static const TextStyle title1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.36,
    height: 1.2,
  );

  // Title 2 (22pt)
  static const TextStyle title2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.35,
    height: 1.25,
  );

  // Title 3 (20pt)
  static const TextStyle title3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.38,
    height: 1.3,
  );

  // === BODY ===

  // Body Large (17pt)
  static const TextStyle body = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.41,
    height: 1.35,
  );

  // Body Medium (15pt)
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.24,
    height: 1.33,
  );

  // === NÚMEROS GRANDES (Dashboard) ===

  // Display Number (48pt) - Para stats principales
  static const TextStyle displayNumber = TextStyle(
    fontSize: 48,
    fontWeight: FontWeight.bold,
    letterSpacing: 0,
    height: 1.1,
  );

  // Stat Number (32pt) - Para cards
  static const TextStyle statNumber = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.15,
  );

  // === LABELS ===

  // Caption 1 (12pt)
  static const TextStyle caption1 = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.33,
  );

  // Caption 2 (11pt)
  static const TextStyle caption2 = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.07,
    height: 1.36,
  );
}
```

---

## 🎴 Components

### Card Style (Apple Health Card)

```dart
// widgets/cards/apple_card.dart

class AppleCard extends StatelessWidget {
  final Widget child;
  final Color? backgroundColor;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}
```

### Ring Progress (Estilo Activity Rings)

```dart
// widgets/charts/activity_ring.dart

class ActivityRing extends StatelessWidget {
  final double progress;         // 0.0 a 1.0
  final Color color;
  final double strokeWidth;
  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: RingPainter(
        progress: progress,
        color: color,
        strokeWidth: strokeWidth,
      ),
    );
  }
}

class RingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  RingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle (gris claro)
    final backgroundPaint = Paint()
      ..color = Colors.grey.withOpacity(0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, backgroundPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * pi * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,  // Start from top
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(RingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
```

---

## 📱 Ejemplo: Dashboard Card (Estilo Apple)

```dart
// screens/dashboard/widgets/energy_summary_card.dart

class EnergySummaryCard extends StatelessWidget {
  final double totalKwh;
  final double goalKwh;
  final double changePercent;

  @override
  Widget build(BuildContext context) {
    final progress = totalKwh / goalKwh;

    return AppleCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ENERGÍA',
                style: AppTextStyles.caption1.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),
              Icon(
                Icons.bolt,
                color: AppColors.energyPrimary,
                size: 20,
              ),
            ],
          ),

          SizedBox(height: 16),

          // Ring + Number
          Row(
            children: [
              // Activity Ring
              SizedBox(
                width: 100,
                height: 100,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ActivityRing(
                      progress: progress,
                      color: AppColors.energyPrimary,
                      strokeWidth: 12,
                      size: 100,
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          totalKwh.toStringAsFixed(1),
                          style: AppTextStyles.statNumber.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          'kWh',
                          style: AppTextStyles.caption1.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              SizedBox(width: 24),

              // Stats
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hoy',
                      style: AppTextStyles.caption1.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '${totalKwh.toStringAsFixed(1)} / ${goalKwh.toStringAsFixed(0)} kWh',
                      style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 12),

                    // Change indicator
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: changePercent < 0
                            ? AppColors.energyLight.withOpacity(0.2)
                            : AppColors.alertRed.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            changePercent < 0
                                ? Icons.arrow_downward
                                : Icons.arrow_upward,
                            size: 14,
                            color: changePercent < 0
                                ? AppColors.energyPrimary
                                : AppColors.alertRed,
                          ),
                          SizedBox(width: 4),
                          Text(
                            '${changePercent.abs().toStringAsFixed(1)}%',
                            style: AppTextStyles.caption1.copyWith(
                              color: changePercent < 0
                                  ? AppColors.energyPrimary
                                  : AppColors.alertRed,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          SizedBox(height: 16),

          // Footer message
          Text(
            changePercent < 0
                ? '¡Excelente! Ahorraste ${changePercent.abs()}% vs ayer'
                : 'Consumo ${changePercent}% mayor que ayer',
            style: AppTextStyles.caption1.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 🎭 Animaciones

### Principios Apple:
- **Duration**: 0.3s - 0.5s (rápidas pero suaves)
- **Curves**: `Curves.easeInOut`, `Curves.spring`
- **Evitar**: Animaciones muy largas (>1s)

```dart
// Ejemplo: Fade + Scale al aparecer
class FadeInScale extends StatefulWidget {
  final Widget child;
  final Duration duration;

  @override
  _FadeInScaleState createState() => _FadeInScaleState();
}

class _FadeInScaleState extends State<FadeInScale>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration ?? Duration(milliseconds: 400),
      vsync: this,
    );

    _opacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOut,
      ),
    );

    _scale = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
      ),
    );

    _controller.forward();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: ScaleTransition(
        scale: _scale,
        child: widget.child,
      ),
    );
  }
}
```

---

## 📏 Spacing & Sizing

### Sistema de Espaciado (8pt grid)

```dart
class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}

class AppSizing {
  // Border Radius
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 20.0;
  static const double radiusXl = 28.0;

  // Icon Sizes
  static const double iconSm = 16.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
  static const double iconXl = 48.0;

  // Card Heights
  static const double cardHeightSm = 120.0;
  static const double cardHeightMd = 180.0;
  static const double cardHeightLg = 240.0;
}
```

---

## 🎯 Ejemplos Visuales

### Dashboard Principal

```
┌─────────────────────────────────────┐
│  Buenos días, Salvador               │
│  Viernes, 14 de Febrero             │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ENERGÍA               ⚡      │ │
│  │                               │ │
│  │   ◯  45.2        Hoy          │ │
│  │  ◯ ◯  kWh      45.2/50 kWh    │ │
│  │   ◯            ↓ 12% vs ayer  │ │
│  │                               │ │
│  │  ¡Excelente! Ahorraste 12%    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ AGUA                  💧      │ │
│  │                               │ │
│  │   ◯  230         Hoy          │ │
│  │  ◯ ◯   L       230/250 L      │ │
│  │   ◯            ↑ 5% vs ayer   │ │
│  │                               │ │
│  │  Consumo 5% mayor que ayer    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ESTA SEMANA                        │
│  [Gráfica de barras gradiente]     │
│                                     │
└─────────────────────────────────────┘
```

### Características Clave:
- ✅ Cards con sombra sutil
- ✅ Números grandes y bold
- ✅ Anillos de progreso (Activity Rings)
- ✅ Colores vibrantes con propósito
- ✅ Espaciado generoso
- ✅ Typography clara y legible

---

## 📝 Checklist de Diseño Apple

Para cada pantalla, verificar:

- [ ] Usa San Francisco (SF Pro) o Roboto
- [ ] Números importantes son grandes (32pt+)
- [ ] Textos secundarios son grises (#8E8E93)
- [ ] Cards con border-radius 20px
- [ ] Sombras sutiles (opacity 0.05)
- [ ] Spacing múltiplo de 8px
- [ ] Colores vibrantes pero con propósito
- [ ] Animaciones suaves (0.3s - 0.5s)
- [ ] Iconos SF Symbols style
- [ ] Empty states con ilustraciones
- [ ] Loading con shimmer effect
- [ ] Gradientes sutiles en backgrounds

---

## 🎨 Mockup ASCII: Pantalla de Gamificación

```
┌─────────────────────────────────────┐
│  ← Gamificación                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │    👤                         │ │
│  │                               │ │
│  │    Nivel 5                    │ │
│  │    1,250 puntos               │ │
│  │                               │ │
│  │    ████████░░ 70%             │ │
│  │    350 pts para nivel 6       │ │
│  │                               │ │
│  │    🔥 Racha: 12 días          │ │
│  └───────────────────────────────┘ │
│                                     │
│  TUS LOGROS                         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✅ 🎉 Primera Semana          │ │
│  │    +100 pts                   │ │
│  │    Desbloqueado: 5 Feb        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⏳ 💰 Ahorrador Principiante  │ │
│  │    ████████░░ 65%             │ │
│  │    +150 pts al completar      │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔒 💎 Ahorrador Experto       │ │
│  │    Requiere: Ahorrador Princ. │ │
│  │    +300 pts                   │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

¿Te gusta esta dirección de diseño estilo Apple? 🍎
