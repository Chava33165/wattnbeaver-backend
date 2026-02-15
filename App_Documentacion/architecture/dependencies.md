# Dependencias Flutter

## 📦 pubspec.yaml

```yaml
name: wattnbeaber_app
description: Sistema de monitoreo energético e hídrico
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

  # ========================================
  # NETWORKING
  # ========================================
  http: ^1.2.0                    # HTTP client para API REST
  dio: ^5.4.0                     # Alternativa a http (más features)

  # ========================================
  # STATE MANAGEMENT
  # ========================================
  provider: ^6.1.1                # State management simple y efectivo
  # Alternativas:
  # riverpod: ^2.4.0              # Provider mejorado
  # bloc: ^8.1.0                  # Para apps grandes

  # ========================================
  # MQTT (IoT Real-time)
  # ========================================
  mqtt_client: ^10.2.0            # Cliente MQTT para tiempo real

  # ========================================
  # STORAGE LOCAL
  # ========================================
  shared_preferences: ^2.2.2      # Key-value storage (tokens, configs)
  hive: ^2.2.3                    # DB local NoSQL (cache offline)
  hive_flutter: ^1.1.0

  # ========================================
  # AUTH & SECURITY
  # ========================================
  jwt_decoder: ^2.0.1             # Decodificar y validar JWT
  crypto: ^3.0.3                  # Hashing, encryption

  # ========================================
  # CHARTS & GRAPHS
  # ========================================
  fl_chart: ^0.66.0               # Gráficas hermosas y customizables
  syncfusion_flutter_gauges: ^24.2.9  # Medidores circulares (gauges)
  # syncfusion_flutter_charts: ^24.2.9  # Más tipos de charts

  # ========================================
  # UI COMPONENTS
  # ========================================
  flutter_svg: ^2.0.9             # Soporte SVG
  cached_network_image: ^3.3.1    # Cache de imágenes de red
  shimmer: ^3.0.0                 # Skeleton loading effect
  lottie: ^3.0.0                  # Animaciones JSON (Lottie)
  animations: ^2.0.11             # Transiciones de pantalla

  # ========================================
  # DATE & TIME
  # ========================================
  intl: ^0.19.0                   # Internacionalización, formateo
  timeago: ^3.6.0                 # "hace 2 horas"

  # ========================================
  # UTILITIES
  # ========================================
  equatable: ^2.0.5               # Comparación de objetos
  logger: ^2.0.2                  # Logging mejorado
  connectivity_plus: ^5.0.2       # Detectar conectividad
  package_info_plus: ^5.0.1       # Info de la app (versión, etc)
  url_launcher: ^6.2.4            # Abrir URLs externas

  # ========================================
  # PERMISSIONS & DEVICE
  # ========================================
  permission_handler: ^11.2.0     # Manejar permisos
  device_info_plus: ^9.1.1        # Info del dispositivo

  # ========================================
  # NOTIFICATIONS
  # ========================================
  flutter_local_notifications: ^16.3.2  # Notificaciones locales
  # firebase_messaging: ^14.7.10  # Push notifications (opcional)

  # ========================================
  # ICONS
  # ========================================
  cupertino_icons: ^1.0.6         # iOS icons
  font_awesome_flutter: ^10.7.0   # Font Awesome icons

dev_dependencies:
  flutter_test:
    sdk: flutter

  # ========================================
  # LINTING & CODE QUALITY
  # ========================================
  flutter_lints: ^3.0.1           # Linting rules recomendadas

  # ========================================
  # TESTING
  # ========================================
  mockito: ^5.4.4                 # Mocking para tests
  http_mock_adapter: ^0.6.1       # Mock HTTP requests

  # ========================================
  # CODE GENERATION
  # ========================================
  build_runner: ^2.4.8            # Para generación de código
  hive_generator: ^2.0.1          # Generar adapters de Hive
  json_serializable: ^6.7.1       # JSON serialization (opcional)

# ========================================
# ASSETS
# ========================================
flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/
    - assets/animations/

  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
        - asset: assets/fonts/Roboto-Bold.ttf
          weight: 700
```

## 📊 Análisis de Dependencias Clave

### 🎯 Obligatorias (Core)

| Package | Uso | Razón |
|---------|-----|-------|
| **http** o **dio** | API REST | Comunicación con backend |
| **provider** | State mgmt | Simple y efectivo |
| **mqtt_client** | MQTT | Tiempo real IoT |
| **shared_preferences** | Storage | Guardar token JWT |
| **jwt_decoder** | Auth | Validar tokens |
| **fl_chart** | Gráficas | Dashboard visuales |
| **intl** | Formateo | Fechas, números, i18n |

### ⭐ Altamente Recomendadas

| Package | Uso | Razón |
|---------|-----|-------|
| **shimmer** | Loading | UX profesional |
| **cached_network_image** | Imágenes | Performance |
| **connectivity_plus** | Red | Detección online/offline |
| **logger** | Debug | Logs estructurados |
| **timeago** | Timestamps | "hace 2 horas" |

### 🎨 Opcionales (UI Polish)

| Package | Uso | Cuándo Usar |
|---------|-----|-------------|
| **lottie** | Animaciones | Splash, empty states |
| **syncfusion_gauges** | Medidores | Dashboard circular |
| **animations** | Transiciones | Navegación suave |
| **font_awesome_flutter** | Iconos | Más variedad |

## 🚀 Instalación

```bash
# Crear proyecto
flutter create wattnbeaber_app
cd wattnbeaber_app

# Copiar pubspec.yaml (el de arriba)
# Luego instalar dependencias:
flutter pub get

# Generar código (si usas Hive o JSON serialization)
flutter pub run build_runner build --delete-conflicting-outputs
```

## 📝 Comandos Útiles

```bash
# Ver dependencias desactualizadas
flutter pub outdated

# Actualizar dependencias
flutter pub upgrade

# Analizar dependencias no usadas
flutter pub deps

# Limpiar y reinstalar
flutter clean
flutter pub get
```

## ⚠️ Consideraciones

### Tamaño de la App
- Syncfusion packages son **pesados** (~15-20MB)
- Alternativa ligera: usar solo fl_chart
- Considerar uso de **tree shaking** en release

### Versiones
- Siempre usar `^` para minor updates: `http: ^1.2.0`
- Para producción, considerar fijar versiones exactas

### Licenses
- Syncfusion requiere licencia para uso comercial
- Verificar licenses de cada package en pub.dev

## 🔄 Alternativas

### State Management
```yaml
# Simple → Complejo
provider: ^6.1.1        # ✅ Recomendado para este proyecto
riverpod: ^2.4.0        # Provider mejorado
bloc: ^8.1.0            # Arquitectura más compleja
get: ^4.6.6             # Todo-en-uno (no recomendado)
```

### HTTP Client
```yaml
http: ^1.2.0            # ✅ Simple y oficial
dio: ^5.4.0             # Más features (interceptors, etc)
chopper: ^7.1.0         # Generador de código
```

### Charts
```yaml
fl_chart: ^0.66.0                # ✅ Gratis, hermoso
syncfusion_flutter_charts: ^24   # Profesional, licencia
charts_flutter: ^0.12.0          # Google Charts (deprecated)
```

## 📦 Para MVP (v1.0)

Dependencias **mínimas** para empezar:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Core
  http: ^1.2.0
  provider: ^6.1.1
  mqtt_client: ^10.2.0
  shared_preferences: ^2.2.2
  jwt_decoder: ^2.0.1

  # UI
  fl_chart: ^0.66.0
  shimmer: ^3.0.0
  intl: ^0.19.0
  timeago: ^3.6.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
```

Luego agregar más según necesites.

## 📝 Notas

- Evitar agregar muchas dependencias al inicio
- Agregar solo lo que realmente necesites
- Revisar pub.dev para ver popularidad y mantenimiento
- Preferir packages oficiales de Flutter cuando existan
