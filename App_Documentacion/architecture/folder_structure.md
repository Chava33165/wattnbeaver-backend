# Estructura de Carpetas Flutter

## 📁 Estructura Recomendada

```
wattnbeaber_app/
├── android/                    # Código nativo Android
├── ios/                        # Código nativo iOS
├── lib/
│   ├── main.dart              # Entry point
│   │
│   ├── core/                  # Núcleo de la app
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   ├── app_colors.dart
│   │   │   ├── app_strings.dart
│   │   │   └── mqtt_topics.dart
│   │   ├── utils/
│   │   │   ├── validators.dart
│   │   │   ├── date_formatter.dart
│   │   │   └── number_formatter.dart
│   │   └── theme/
│   │       ├── app_theme.dart
│   │       ├── text_styles.dart
│   │       └── dimensions.dart
│   │
│   ├── models/                # Modelos de datos
│   │   ├── user.dart
│   │   ├── device.dart
│   │   ├── energy_reading.dart
│   │   ├── water_reading.dart
│   │   ├── alert.dart
│   │   ├── achievement.dart
│   │   ├── challenge.dart
│   │   ├── gamification.dart
│   │   └── api_response.dart
│   │
│   ├── services/              # Servicios
│   │   ├── api/
│   │   │   ├── api_service.dart
│   │   │   ├── auth_api.dart
│   │   │   ├── device_api.dart
│   │   │   ├── energy_api.dart
│   │   │   ├── water_api.dart
│   │   │   └── gamification_api.dart
│   │   ├── mqtt/
│   │   │   ├── mqtt_service.dart
│   │   │   └── mqtt_handler.dart
│   │   ├── storage/
│   │   │   └── storage_service.dart
│   │   └── notification/
│   │       └── notification_service.dart
│   │
│   ├── providers/             # State management (Provider)
│   │   ├── auth_provider.dart
│   │   ├── dashboard_provider.dart
│   │   ├── devices_provider.dart
│   │   ├── energy_provider.dart
│   │   ├── water_provider.dart
│   │   └── gamification_provider.dart
│   │
│   ├── screens/               # Pantallas
│   │   ├── splash/
│   │   │   └── splash_screen.dart
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── dashboard/
│   │   │   ├── dashboard_screen.dart
│   │   │   └── widgets/
│   │   │       ├── energy_card.dart
│   │   │       ├── water_card.dart
│   │   │       ├── weekly_chart.dart
│   │   │       └── device_quick_access.dart
│   │   ├── devices/
│   │   │   ├── devices_screen.dart
│   │   │   ├── device_detail_screen.dart
│   │   │   ├── add_device_screen.dart
│   │   │   └── widgets/
│   │   │       └── device_card.dart
│   │   ├── energy/
│   │   │   ├── energy_screen.dart
│   │   │   └── widgets/
│   │   │       └── energy_chart.dart
│   │   ├── water/
│   │   │   ├── water_screen.dart
│   │   │   └── widgets/
│   │   │       └── water_chart.dart
│   │   ├── alerts/
│   │   │   ├── alerts_screen.dart
│   │   │   └── widgets/
│   │   │       └── alert_card.dart
│   │   ├── gamification/
│   │   │   ├── gamification_screen.dart
│   │   │   └── widgets/
│   │   │       ├── achievement_card.dart
│   │   │       ├── challenge_card.dart
│   │   │       └── leaderboard_item.dart
│   │   └── profile/
│   │       ├── profile_screen.dart
│   │       └── settings_screen.dart
│   │
│   ├── widgets/               # Widgets reutilizables
│   │   ├── common/
│   │   │   ├── custom_button.dart
│   │   │   ├── custom_text_field.dart
│   │   │   ├── loading_indicator.dart
│   │   │   ├── error_widget.dart
│   │   │   └── empty_state.dart
│   │   ├── charts/
│   │   │   ├── line_chart_widget.dart
│   │   │   ├── bar_chart_widget.dart
│   │   │   └── gauge_widget.dart
│   │   └── cards/
│   │       └── stat_card.dart
│   │
│   └── routes/                # Navegación
│       ├── app_routes.dart
│       └── route_generator.dart
│
├── assets/                    # Recursos
│   ├── images/
│   │   ├── logo.png
│   │   ├── empty_states/
│   │   └── illustrations/
│   ├── icons/
│   └── fonts/
│
├── test/                      # Tests
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── pubspec.yaml              # Dependencias
└── README.md
```

## 🎯 Convenciones de Nomenclatura

### Archivos
- **snake_case**: `energy_reading.dart`, `mqtt_service.dart`
- Widgets terminan en `_widget.dart` o `_screen.dart`
- Providers terminan en `_provider.dart`
- Services terminan en `_service.dart` o `_api.dart`

### Clases
- **PascalCase**: `EnergyReading`, `MqttService`
- Widgets: `EnergyCard`, `DashboardScreen`
- Providers: `AuthProvider`, `DashboardProvider`

### Variables y Métodos
- **camelCase**: `energyReading`, `loadDevices()`
- Privados con `_`: `_token`, `_handleError()`

### Constantes
- **SCREAMING_SNAKE_CASE**: `API_BASE_URL`, `MAX_RETRIES`
- O camelCase con const: `const apiBaseUrl`

## 📦 Organización por Features (Alternativa)

Si prefieres organización por features:

```
lib/
├── features/
│   ├── auth/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── services/
│   │   └── widgets/
│   ├── dashboard/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   └── widgets/
│   └── devices/
│       ├── models/
│       ├── providers/
│       ├── screens/
│       └── widgets/
└── core/
    ├── services/
    ├── theme/
    └── utils/
```

## 📝 Ventajas de Cada Enfoque

### Por Tipo (Recomendado para este proyecto)
✅ Más simple para equipos pequeños
✅ Fácil encontrar todos los modelos juntos
✅ Menos anidamiento
✅ Mejor para proyectos pequeños/medianos

### Por Features
✅ Escalable para proyectos grandes
✅ Features desacoplados
✅ Más fácil trabajar en equipo (por feature)
✅ Posible extraer features como packages

## 🚀 Para WattBeaber: Usar estructura por TIPO

Razón: Proyecto de tamaño medio, equipo pequeño, más simple de mantener.

## 📝 Notas

- Mantener archivos < 300 líneas cuando sea posible
- Separar widgets grandes en archivos propios
- Usar barrels (`index.dart`) para exports si crece mucho
