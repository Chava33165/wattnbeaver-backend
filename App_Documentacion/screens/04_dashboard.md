# Dashboard Screen

## 📄 Descripción
Pantalla principal de la aplicación. Centro de control para monitoreo de consumo energético e hídrico.

## 🎯 Objetivo
- Mostrar vista general del consumo actual
- Acceso rápido a todas las secciones
- Visualizar alertas importantes
- Mostrar progreso de gamificación

## 🎨 Elementos Visuales

### Layout

```
┌─────────────────────────────────────┐
│  Header (AppBar)                    │
├─────────────────────────────────────┤
│  [Avatar] Hola, Juan      [🔔 3]   │
├─────────────────────────────────────┤
│  📊 Resumen de Hoy                  │
│  ┌──────────┐  ┌──────────┐        │
│  │ ⚡ Energía│  │ 💧 Agua   │        │
│  │ 45.2 kWh │  │ 230 L    │        │
│  │ ↓ -12%   │  │ ↑ +5%    │        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│  📈 Consumo Semanal                 │
│  [Gráfica de barras]                │
├─────────────────────────────────────┤
│  📱 Tus Dispositivos                │
│  [Lista horizontal - scroll]        │
│  • Refrigerador  • Lavadora         │
│  • Medidor agua  • Calentador       │
├─────────────────────────────────────┤
│  🏆 Gamificación                    │
│  Nivel 5 • 1,250 puntos             │
│  [Progress bar: 70% al nivel 6]     │
├─────────────────────────────────────┤
│  🚨 Alertas Recientes (3)           │
│  ⚠️ Consumo alto detectado          │
│  💡 Tip: Reduce luces en día        │
└─────────────────────────────────────┘
│  Bottom Navigation                  │
└─────────────────────────────────────┘
```

### Componentes Principales

#### 1. **Header**
- Avatar del usuario (circular)
- Saludo personalizado: "Hola, [Nombre]"
- Icono notificaciones con badge count
- Fecha actual

#### 2. **Cards de Resumen**
- **Card Energía** (verde)
  - Icono: ⚡
  - Valor actual del día
  - Porcentaje de cambio vs ayer
  - Gráfica sparkline (opcional)

- **Card Agua** (azul)
  - Icono: 💧
  - Valor actual del día
  - Porcentaje de cambio vs ayer
  - Gráfica sparkline (opcional)

#### 3. **Gráfica Semanal**
- Últimos 7 días
- Barras para energía y agua
- Tap para ver detalles del día
- Leyenda: Verde (energía), Azul (agua)

#### 4. **Dispositivos Rápidos**
- Scroll horizontal
- Cards compactas por dispositivo
- Estado: online/offline
- Consumo actual
- Tap → Detalle dispositivo

#### 5. **Widget Gamificación**
- Nivel actual
- Puntos totales
- Barra de progreso a siguiente nivel
- Último logro desbloqueado (icono)
- Tap → Pantalla gamificación completa

#### 6. **Alertas Recientes**
- Máximo 3 alertas más recientes
- Icono según severidad
- Mensaje breve
- Botón "Ver todas"

#### 7. **Bottom Navigation**
- 🏠 Inicio (Dashboard)
- ⚡ Energía
- 💧 Agua
- 📱 Dispositivos
- 👤 Perfil

## 🔄 Flujo de Navegación

```
Dashboard
    ├─> (tap Card Energía) → Energía Detail
    ├─> (tap Card Agua) → Agua Detail
    ├─> (tap Dispositivo) → Detalle Dispositivo
    ├─> (tap Widget Gamificación) → Gamificación
    ├─> (tap Alerta) → Alertas
    ├─> (tap Notificaciones) → Notificaciones
    └─> (Bottom Nav) → Otras secciones
```

## 🌐 API Integration

### Endpoints Necesarios

```dart
// 1. Resumen del día
GET /api/v1/energy/summary/today
GET /api/v1/water/summary/today

// 2. Consumo semanal
GET /api/v1/energy/summary/week
GET /api/v1/water/summary/week

// 3. Dispositivos del usuario
GET /api/v1/devices?limit=6

// 4. Gamificación del usuario
GET /api/v1/gamification/me

// 5. Alertas recientes
GET /api/v1/alerts?limit=3&acknowledged=false
```

## 🔄 Real-time Updates (MQTT)

```dart
// Suscribirse a topics MQTT
topics:
  - wattnbeaber/energy/[user_id]/current
  - wattnbeaber/water/[user_id]/current
  - wattnbeaber/alerts/[user_id]
```

Actualizar cards en tiempo real cuando lleguen mensajes.

## 📱 State Management

```dart
class DashboardProvider extends ChangeNotifier {
  User? user;
  EnergySummary? energySummary;
  WaterSummary? waterSummary;
  List<Device> devices = [];
  Gamification? gamification;
  List<Alert> recentAlerts = [];
  bool isLoading = true;

  Future<void> loadDashboard() async {
    isLoading = true;
    notifyListeners();

    try {
      // Cargar datos en paralelo
      await Future.wait([
        _loadEnergySummary(),
        _loadWaterSummary(),
        _loadDevices(),
        _loadGamification(),
        _loadAlerts(),
      ]);
    } catch (e) {
      // Manejar error
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void connectMQTT() {
    mqttService.subscribe('wattnbeaber/energy/${user.id}/current');
    mqttService.onMessage((topic, payload) {
      // Actualizar energySummary en tiempo real
      notifyListeners();
    });
  }
}
```

## ⚡ Optimizaciones

- [ ] Lazy loading de widgets
- [ ] Cache de imágenes de dispositivos
- [ ] Debounce en actualizaciones MQTT (max 1/seg)
- [ ] Pull-to-refresh
- [ ] Skeleton loading mientras carga
- [ ] Offline mode (mostrar últimos datos cached)

## ✅ Criterios de Aceptación

- [ ] Muestra resumen de energía y agua correctamente
- [ ] Gráfica semanal renderiza bien
- [ ] Dispositivos se muestran con estado actual
- [ ] Gamificación muestra nivel y puntos
- [ ] Alertas son clickeables
- [ ] Bottom nav funciona correctamente
- [ ] Pull-to-refresh actualiza datos
- [ ] Updates en tiempo real via MQTT
- [ ] Maneja estado de carga
- [ ] Maneja errores gracefully
- [ ] Responsive en tablets

## 🎨 Assets Necesarios

- Iconos: energía, agua, dispositivos por tipo
- Avatar placeholder
- Ilustraciones para empty states

## 📝 Notas

- Esta es la pantalla más compleja, considerar dividir en widgets
- Implementar analytics para tracking de interacciones
- Considerar modo oscuro en v2.0
