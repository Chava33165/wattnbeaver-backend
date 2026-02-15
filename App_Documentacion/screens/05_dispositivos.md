# Pantalla de Dispositivos

## 📄 Descripción
Vista completa de todos los dispositivos IoT del usuario.

## 🎯 Objetivo
- Listar todos los dispositivos registrados
- Mostrar estado actual (online/offline)
- Permitir agregar nuevos dispositivos
- Acceso rápido a detalles de cada dispositivo

## 🎨 Elementos Visuales

### Layout

```
┌─────────────────────────────────────┐
│  ← Mis Dispositivos        [+ Nuevo]│
├─────────────────────────────────────┤
│  🔍 Buscar dispositivo...           │
├─────────────────────────────────────┤
│  Filtros: [Todos] [Energía] [Agua] │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ ⚡ Refrigerador        ● Online│  │
│  │ Consumo: 145W                 │  │
│  │ Ubicación: Cocina             │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 💧 Medidor Principal  ● Online│  │
│  │ Flujo: 12 L/min               │  │
│  │ Ubicación: Entrada            │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ ⚡ Lavadora            ○ Offline│ │
│  │ Última conexión: hace 2h      │  │
│  │ Ubicación: Lavandería         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Componentes

#### 1. **Header**
- Título: "Mis Dispositivos"
- Botón FAB: "+" para agregar dispositivo
- Contador: "{X} dispositivos"

#### 2. **Search Bar**
- Búsqueda por nombre
- Debounce 300ms

#### 3. **Chips de Filtro**
- Todos
- Energía (⚡)
- Agua (💧)
- Online/Offline

#### 4. **Device Card**
Para cada dispositivo:
- Icono según tipo
- Nombre del dispositivo
- Estado (● Online / ○ Offline)
- Consumo/flujo actual
- Ubicación
- Última actualización
- Swipe actions: Editar | Eliminar

## 🔄 Flujo de Navegación

```
Dispositivos
    ├─> (tap Card) → Detalle Dispositivo
    ├─> (tap +) → Agregar Dispositivo
    ├─> (swipe → Editar) → Editar Dispositivo
    └─> (swipe → Eliminar) → Confirmar Eliminación
```

## 🌐 API Integration

### Endpoints

```dart
// Listar dispositivos
GET /api/v1/devices

Response:
{
  "success": true,
  "data": [
    {
      "id": "dev-123",
      "device_id": "WB_ENERGY_001",
      "device_name": "Refrigerador",
      "device_type": "energy",
      "location": "Cocina",
      "status": "active",
      "current_reading": {
        "power": 145,
        "voltage": 220,
        "timestamp": "2026-02-14T23:00:00Z"
      }
    }
  ]
}

// Eliminar dispositivo
DELETE /api/v1/devices/{id}

// Actualizar dispositivo
PUT /api/v1/devices/{id}
Body: {
  "device_name": "Nuevo nombre",
  "location": "Nueva ubicación"
}
```

## 📱 State Management

```dart
class DevicesProvider extends ChangeNotifier {
  List<Device> _devices = [];
  List<Device> get devices => _devices;

  String _searchQuery = '';
  String _filterType = 'all'; // 'all', 'energy', 'water'

  List<Device> get filteredDevices {
    var filtered = _devices;

    // Filtrar por búsqueda
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((d) =>
        d.deviceName.toLowerCase().contains(_searchQuery.toLowerCase())
      ).toList();
    }

    // Filtrar por tipo
    if (_filterType != 'all') {
      filtered = filtered.where((d) =>
        d.deviceType == _filterType
      ).toList();
    }

    return filtered;
  }

  Future<void> loadDevices() async {
    final response = await ApiService.getDevices();
    _devices = response.data;
    notifyListeners();
  }

  Future<void> deleteDevice(String id) async {
    await ApiService.deleteDevice(id);
    _devices.removeWhere((d) => d.id == id);
    notifyListeners();
  }
}
```

## 🎨 Estados de UI

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│         [Ilustración]               │
│                                     │
│    No tienes dispositivos           │
│                                     │
│    Agrega tu primer dispositivo     │
│    para empezar a monitorear        │
│                                     │
│    [+ Agregar Dispositivo]          │
│                                     │
└─────────────────────────────────────┘
```

### Loading State
- Skeleton cards (shimmer effect)

### Error State
- Mensaje de error
- Botón "Reintentar"

## ✅ Criterios de Aceptación

- [ ] Lista todos los dispositivos del usuario
- [ ] Muestra estado online/offline correctamente
- [ ] Búsqueda funciona con debounce
- [ ] Filtros funcionan correctamente
- [ ] Swipe actions implementados
- [ ] Confirmación antes de eliminar
- [ ] Pull-to-refresh
- [ ] Navegación a detalle funciona
- [ ] Empty state se muestra cuando no hay devices
- [ ] Loading state durante fetch

## 🔄 Real-time Updates

```dart
// Actualizar estado de dispositivos via MQTT
mqttService.subscribe('wattnbeaber/devices/+/status');
mqttService.onMessage((topic, payload) {
  final deviceId = topic.split('/')[2];
  updateDeviceStatus(deviceId, payload);
});
```

## 🎨 Assets Necesarios

- Iconos dispositivos: refrigerador, lavadora, medidor, etc.
- Ilustración empty state
- Iconos de estado: online (verde), offline (gris)

## 📝 Notas

- Implementar confirmación de eliminación con BottomSheet
- Considerar agrupación por ubicación/habitación en v2.0
- Agregar QR scanner para agregar dispositivos en v2.0
