# Agregar Dispositivo - Flujo de Provisioning WiFi

## 📄 Descripción
Proceso completo de descubrimiento, conexión y configuración de dispositivos IoT WattBeaber.

## 🎯 Objetivo
- Descubrir dispositivos WattBeaber cercanos
- Conectar dispositivo a la red WiFi del usuario
- Registrar dispositivo en el backend
- Asignar nombre y ubicación personalizada

## 🔄 Flujo Completo de Provisioning

### Paso 1: Iniciar Búsqueda
```
Usuario tap en botón "+" (FAB)
    ↓
Pantalla: "Agregar Dispositivo"
    ↓
[Buscar Dispositivos]
```

### Paso 2: Escaneo WiFi
```
App escanea redes WiFi cercanas
Busca SSIDs con patrón: "WattBeaber_*"
    ↓
Muestra lista de dispositivos encontrados
```

### Paso 3: Selección de Dispositivo
```
Usuario selecciona dispositivo de la lista
Ej: "WattBeaber_Energy_ABC123"
    ↓
App solicita permisos de ubicación (Android)
App se conecta a la red WiFi del dispositivo
```

### Paso 4: Conexión al Dispositivo
```
App se conecta a: WattBeaber_Energy_ABC123
IP del dispositivo: 192.168.4.1 (AP mode)
    ↓
App envía request HTTP al dispositivo
GET http://192.168.4.1/api/info
```

### Paso 5: Configuración WiFi
```
Usuario ingresa:
  - Nombre del dispositivo: "Refrigerador"
  - Ubicación: "Cocina"
  - Red WiFi de casa: "MiCasa_WiFi"
  - Contraseña WiFi: "********"
    ↓
App envía configuración al dispositivo
POST http://192.168.4.1/api/setup
```

### Paso 6: Dispositivo se Conecta
```
Dispositivo recibe configuración
    ↓
Dispositivo se conecta a "MiCasa_WiFi"
    ↓
Dispositivo obtiene IP de la red local
    ↓
Dispositivo se registra en backend vía MQTT/HTTP
```

### Paso 7: Registro en Backend
```
Dispositivo envía:
POST https://api.wattnbeaber.com/api/v1/devices/register
Body: {
  "device_id": "WB_ENERGY_ABC123",
  "device_type": "energy",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.0.0"
}
    ↓
Backend crea dispositivo asociado al usuario
    ↓
Backend devuelve confirmación
```

### Paso 8: Confirmación
```
App detecta que dispositivo está online
    ↓
Muestra pantalla de éxito
"✅ Refrigerador conectado exitosamente"
    ↓
Navega a Dashboard o Lista de Dispositivos
```

---

## 🎨 Diseño de Pantallas (Estilo Apple Health)

### Pantalla 1: Agregar Dispositivo (Inicio)

```
┌─────────────────────────────────────┐
│  ← Agregar Dispositivo              │
├─────────────────────────────────────┤
│                                     │
│         [Ilustración de IoT]        │
│                                     │
│     Conecta tu dispositivo          │
│     WattBeaber                      │
│                                     │
│  1. Enciende tu dispositivo         │
│  2. Presiona el botón de setup      │
│     por 5 segundos                  │
│  3. El LED parpadeará en azul       │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   🔍 Buscar Dispositivos    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ¿Tienes problemas?                 │
│  [Ver guía de conexión]             │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 2: Escaneando

```
┌─────────────────────────────────────┐
│  ← Buscando dispositivos...         │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         [Animación radar]           │
│              📡                     │
│         Escaneando...               │
│                                     │
│                                     │
│  Buscando dispositivos WattBeaber   │
│  cercanos en tu red WiFi            │
│                                     │
│  [Loading spinner circular]         │
│                                     │
│                                     │
│  [Cancelar]                         │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 3: Dispositivos Encontrados

```
┌─────────────────────────────────────┐
│  ← Dispositivos encontrados (2)     │
├─────────────────────────────────────┤
│                                     │
│  Selecciona tu dispositivo:         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚡ WattBeaber Energy         │   │
│  │                             │   │
│  │ ID: ABC123                  │   │
│  │ Señal: ●●●●○ Fuerte         │   │
│  │                             │   │
│  │         [Conectar]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💧 WattBeaber Water         │   │
│  │                             │   │
│  │ ID: XYZ789                  │   │
│  │ Señal: ●●●○○ Media          │   │
│  │                             │   │
│  │         [Conectar]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🔄 Buscar de nuevo]               │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 4: Conectando al Dispositivo

```
┌─────────────────────────────────────┐
│  ← Conectando...                    │
├─────────────────────────────────────┤
│                                     │
│         ⚡                          │
│    WattBeaber Energy                │
│                                     │
│  [Progress circular 45%]            │
│                                     │
│  Conectando al dispositivo...       │
│                                     │
│  Por favor espera, esto puede       │
│  tomar unos segundos.               │
│                                     │
│  ℹ️ No salgas de esta pantalla      │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 5: Configurar Dispositivo

```
┌─────────────────────────────────────┐
│  ← Configurar Dispositivo           │
├─────────────────────────────────────┤
│                                     │
│  ⚡ WattBeaber Energy (ABC123)      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Nombre del dispositivo      │   │
│  │ [Refrigerador___________]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Ubicación (opcional)        │   │
│  │ [Cocina_________________]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  📶 Conexión WiFi                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Red WiFi                    │   │
│  │ [MiCasa_WiFi_________] 📶  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Contraseña WiFi             │   │
│  │ [●●●●●●●●●●●●●●●●____] 👁  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Conectar Dispositivo    │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 6: Conectando a WiFi

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         [Animación WiFi]            │
│              📶                     │
│                                     │
│    Configurando dispositivo...      │
│                                     │
│  [Progress steps:]                  │
│  ✅ Enviando configuración          │
│  ⏳ Conectando a MiCasa_WiFi        │
│  ⏳ Registrando dispositivo         │
│  ⏳ Verificando conexión            │
│                                     │
│  Esto puede tomar hasta 30 seg.     │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 7: Éxito

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│              ✅                     │
│                                     │
│     ¡Dispositivo Conectado!         │
│                                     │
│                                     │
│  ⚡ Refrigerador                    │
│  📍 Cocina                          │
│  📶 Conectado a MiCasa_WiFi         │
│                                     │
│  Tu dispositivo está listo para     │
│  empezar a monitorear el consumo    │
│  energético.                        │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Ver Dashboard         │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Agregar otro dispositivo]       │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### 1. Permisos Necesarios (Android)

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

### 2. Escaneo WiFi

```dart
import 'package:wifi_iot/wifi_iot.dart';
import 'package:permission_handler/permission_handler.dart';

class DeviceProvisioningService {

  // Solicitar permisos
  Future<bool> requestPermissions() async {
    var status = await Permission.location.request();
    return status.isGranted;
  }

  // Buscar dispositivos WattBeaber
  Future<List<WifiNetwork>> scanForDevices() async {
    // Escanear redes WiFi
    List<WifiNetwork> networks = await WiFiForIoTPlugin.loadWifiList();

    // Filtrar solo dispositivos WattBeaber
    return networks.where((network) {
      return network.ssid.startsWith('WattBeaber_');
    }).toList();
  }

  // Conectar al dispositivo
  Future<bool> connectToDevice(String ssid) async {
    // Guardar red actual para regresar después
    String? currentSSID = await WiFiForIoTPlugin.getSSID();

    // Conectar a la red del dispositivo
    bool connected = await WiFiForIoTPlugin.connect(
      ssid,
      password: '', // Sin contraseña en modo setup
      security: NetworkSecurity.NONE,
    );

    return connected;
  }
}
```

### 3. Comunicación con Dispositivo (HTTP Local)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class DeviceConfigService {
  static const String DEVICE_IP = '192.168.4.1';
  static const int TIMEOUT_SECONDS = 10;

  // Obtener info del dispositivo
  Future<DeviceInfo> getDeviceInfo() async {
    final response = await http.get(
      Uri.parse('http://$DEVICE_IP/api/info'),
    ).timeout(Duration(seconds: TIMEOUT_SECONDS));

    if (response.statusCode == 200) {
      return DeviceInfo.fromJson(json.decode(response.body));
    } else {
      throw Exception('No se pudo obtener info del dispositivo');
    }
  }

  // Enviar configuración WiFi al dispositivo
  Future<bool> configureWiFi({
    required String deviceName,
    required String location,
    required String wifiSSID,
    required String wifiPassword,
    required String userId,
  }) async {
    final response = await http.post(
      Uri.parse('http://$DEVICE_IP/api/setup'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'device_name': deviceName,
        'location': location,
        'wifi_ssid': wifiSSID,
        'wifi_password': wifiPassword,
        'user_id': userId,
        'backend_url': 'https://api.wattnbeaber.com',
      }),
    ).timeout(Duration(seconds: TIMEOUT_SECONDS));

    return response.statusCode == 200;
  }

  // Verificar que dispositivo se conectó a internet
  Future<bool> verifyConnection(String deviceId) async {
    // Esperar a que el dispositivo se registre en backend
    await Future.delayed(Duration(seconds: 5));

    // Consultar backend para ver si dispositivo está online
    final response = await http.get(
      Uri.parse('https://api.wattnbeaber.com/api/v1/devices/$deviceId/status'),
      headers: {
        'Authorization': 'Bearer ${await StorageService.getToken()}',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data']['status'] == 'online';
    }

    return false;
  }
}
```

### 4. Provider para Manejar Estado

```dart
class DeviceProvisioningProvider extends ChangeNotifier {
  ProvisioningState _state = ProvisioningState.initial;
  List<WifiNetwork> _availableDevices = [];
  WifiNetwork? _selectedDevice;
  String? _error;

  ProvisioningState get state => _state;
  List<WifiNetwork> get availableDevices => _availableDevices;
  String? get error => _error;

  // Paso 1: Escanear dispositivos
  Future<void> scanDevices() async {
    _state = ProvisioningState.scanning;
    _error = null;
    notifyListeners();

    try {
      _availableDevices = await DeviceProvisioningService().scanForDevices();
      _state = ProvisioningState.devicesFound;
    } catch (e) {
      _error = 'Error al buscar dispositivos: $e';
      _state = ProvisioningState.error;
    }
    notifyListeners();
  }

  // Paso 2: Conectar a dispositivo seleccionado
  Future<void> connectToDevice(WifiNetwork device) async {
    _selectedDevice = device;
    _state = ProvisioningState.connecting;
    notifyListeners();

    try {
      bool connected = await DeviceProvisioningService()
          .connectToDevice(device.ssid);

      if (connected) {
        _state = ProvisioningState.connected;
      } else {
        throw Exception('No se pudo conectar al dispositivo');
      }
    } catch (e) {
      _error = 'Error al conectar: $e';
      _state = ProvisioningState.error;
    }
    notifyListeners();
  }

  // Paso 3: Configurar WiFi
  Future<void> configureDevice({
    required String deviceName,
    required String location,
    required String wifiSSID,
    required String wifiPassword,
  }) async {
    _state = ProvisioningState.configuring;
    notifyListeners();

    try {
      // Obtener user ID del token
      final userId = await StorageService.getUserId();

      // Enviar configuración al dispositivo
      bool success = await DeviceConfigService().configureWiFi(
        deviceName: deviceName,
        location: location,
        wifiSSID: wifiSSID,
        wifiPassword: wifiPassword,
        userId: userId,
      );

      if (success) {
        _state = ProvisioningState.verifying;
        notifyListeners();

        // Extraer device_id del SSID
        // Ej: "WattBeaber_Energy_ABC123" → "WB_ENERGY_ABC123"
        String deviceId = _parseDeviceId(_selectedDevice!.ssid);

        // Verificar que dispositivo se conectó
        bool online = await DeviceConfigService()
            .verifyConnection(deviceId);

        if (online) {
          _state = ProvisioningState.success;
        } else {
          throw Exception('El dispositivo no se pudo conectar a WiFi');
        }
      } else {
        throw Exception('Error al enviar configuración');
      }
    } catch (e) {
      _error = 'Error al configurar: $e';
      _state = ProvisioningState.error;
    }
    notifyListeners();
  }

  String _parseDeviceId(String ssid) {
    // "WattBeaber_Energy_ABC123" → "WB_ENERGY_ABC123"
    return ssid.replaceAll('WattBeaber_', 'WB_').toUpperCase();
  }

  void reset() {
    _state = ProvisioningState.initial;
    _availableDevices = [];
    _selectedDevice = null;
    _error = null;
    notifyListeners();
  }
}

enum ProvisioningState {
  initial,
  scanning,
  devicesFound,
  connecting,
  connected,
  configuring,
  verifying,
  success,
  error,
}
```

---

## 🔐 Seguridad

### En el Dispositivo (Firmware ESP32/Arduino):
```cpp
// El dispositivo debe:
1. Iniciar en modo AP (Access Point) cuando no está configurado
2. SSID: "WattBeaber_[TYPE]_[SERIAL]"
3. Exponer API HTTP en 192.168.4.1
4. Validar que solo acepte configuración UNA vez
5. Encriptar contraseña WiFi antes de guardar
6. Tener timeout de 5 minutos en modo setup
```

### En la App:
```dart
// Validaciones:
- Verificar SSL/TLS en producción
- No guardar contraseña WiFi en la app
- Timeout en requests al dispositivo
- Manejo de errores robusto
- Regresar a WiFi original si falla
```

---

## ✅ Criterios de Aceptación

- [ ] Escanea y encuentra dispositivos WattBeaber
- [ ] Muestra lista de dispositivos con señal WiFi
- [ ] Se conecta al dispositivo seleccionado
- [ ] Obtiene info del dispositivo (ID, tipo, firmware)
- [ ] Formulario de configuración funciona
- [ ] Selector de redes WiFi disponibles
- [ ] Envía configuración al dispositivo
- [ ] Verifica que dispositivo se conectó a WiFi
- [ ] Registra dispositivo en backend
- [ ] Maneja errores de conexión
- [ ] Timeout si tarda más de 30 seg
- [ ] Regresa a WiFi original al terminar
- [ ] Muestra pantalla de éxito
- [ ] Navega a dashboard con nuevo dispositivo

---

## 📦 Dependencias Adicionales

```yaml
dependencies:
  wifi_iot: ^0.3.18              # Manejo WiFi (Android/iOS)
  permission_handler: ^11.2.0    # Permisos de ubicación
  network_info_plus: ^5.0.1      # Info de red actual
  connectivity_plus: ^5.0.2      # Estado de conectividad
```

---

## 📝 Notas de Implementación

### iOS:
- Requiere Hotspot Configuration Entitlement
- Limitaciones en escaneo WiFi (solo red actual)
- Usar NEHotspotConfiguration

### Android:
- Requiere permisos de ubicación (para escaneo WiFi)
- Funciona mejor en Android 10+
- Manejar diferentes versiones de Android

### Alternativa Simplificada:
Si el escaneo automático es complejo, usar:
1. Instrucciones manuales para que usuario se conecte
2. App detecta cuando está en red WattBeaber_*
3. Continúa con configuración

---

## 🎨 Diseño Estilo Apple Health

Características clave a implementar:
- **Cards grandes** con sombras sutiles
- **Colores gradientes** (verde para energía, azul para agua)
- **Iconos SF Symbols** (si es posible)
- **Animaciones suaves** (curves ease-in-out)
- **Typography** grande y bold para números
- **Espaciado generoso** entre elementos
- **Loading states** con shimmer effect

¿Quieres que cree más ejemplos visuales del diseño estilo Apple Health?
