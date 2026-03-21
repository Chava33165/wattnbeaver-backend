# WattBeaver - Brief para Flutter: Gestión de API Keys de Dispositivos

## 📋 Resumen

La app Flutter ahora debe mostrar y gestionar las **API Keys** de los dispositivos para que los usuarios puedan configurar sus ESP32 vía WiFiManager (portal captive).

---

## 🆕 Cambios en Endpoints Existentes

### GET /api/v1/devices/:id
**Modificación**: Ahora incluye el campo `api_key` en la respuesta

#### Request
```http
GET https://wattnbeaver-api.wattnbeaver.site/api/v1/devices/abc-123-device-uuid
Authorization: Bearer <jwt_token>
```

#### Response
```json
{
  "success": true,
  "message": "Dispositivo obtenido",
  "data": {
    "device": {
      "id": "abc-123-device-uuid",
      "user_id": "user-uuid",
      "household_id": null,
      "device_id": "sensor_001",
      "device_name": "Sensor Cocina",
      "device_type": "water",
      "location": "Cocina",
      "status": "active",
      "api_key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ⬅️ NUEVO CAMPO
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  }
}
```

**Uso en Flutter**:
- Mostrar `api_key` en la pantalla de detalle del dispositivo
- Permitir copiar al portapapeles
- Opcionalmente generar código QR para escanear desde el portal WiFiManager

---

## 🆕 Nuevo Endpoint: Rotar API Key

### POST /api/v1/devices/:id/rotate-key
**Descripción**: Regenera la API key de un dispositivo (útil si se compromete o se pierde)

#### Request
```http
POST https://wattnbeaver-api.wattnbeaver.site/api/v1/devices/abc-123-device-uuid/rotate-key
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "API Key rotada exitosamente",
  "data": {
    "device": {
      "id": "abc-123-device-uuid",
      "device_id": "sensor_001",
      "device_name": "Sensor Cocina",
      "device_type": "water",
      "location": "Cocina",
      "status": "active",
      "api_key": "new-uuid-generated-here",  // ⬅️ Nueva clave
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T15:30:00Z"
    },
    "warning": "API Key rotada exitosamente. Actualiza la configuración de tu ESP32 con la nueva clave."
  }
}
```

#### Response (403 Forbidden)
```json
{
  "success": false,
  "message": "No tienes permiso para modificar este dispositivo"
}
```

#### Response (404 Not Found)
```json
{
  "success": false,
  "message": "Dispositivo no encontrado"
}
```

**Uso en Flutter**:
- Botón "Regenerar API Key" en pantalla de detalle del dispositivo
- Mostrar diálogo de confirmación antes de rotar:
  ```
  ⚠️ Advertencia

  Esta acción invalidará la clave actual. Tu ESP32 dejará de funcionar
  hasta que actualices su configuración con la nueva clave.

  ¿Estás seguro de continuar?

  [Cancelar] [Regenerar]
  ```
- Después de rotar, mostrar la nueva clave con opción de copiar/QR
- Advertencia adicional: "Guarda esta clave antes de salir"

---

## 🎨 Propuesta de UI para Flutter

### Pantalla de Detalle del Dispositivo

```dart
class DeviceDetailScreen extends StatelessWidget {
  final Device device;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(device.deviceName)),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          // Información básica
          ListTile(
            title: Text('ID del Hardware'),
            subtitle: Text(device.deviceId),
          ),
          ListTile(
            title: Text('Tipo'),
            subtitle: Text(device.deviceType == 'water' ? 'Agua' : 'Energía'),
          ),
          ListTile(
            title: Text('Ubicación'),
            subtitle: Text(device.location ?? 'Sin ubicación'),
          ),

          Divider(),

          // Sección de API Key
          Card(
            color: Colors.blue.shade50,
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.vpn_key, color: Colors.blue),
                      SizedBox(width: 8),
                      Text(
                        'API Key para Configuración',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),

                  // API Key con opción de copiar
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: SelectableText(
                            device.apiKey,
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.copy),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: device.apiKey));
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('API Key copiada al portapapeles')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 12),

                  // Código QR (opcional)
                  Center(
                    child: QrImageView(
                      data: device.apiKey,
                      size: 200,
                      backgroundColor: Colors.white,
                    ),
                  ),

                  SizedBox(height: 12),

                  // Instrucciones de configuración
                  Text(
                    'Pasos para configurar tu ESP32:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  _buildStep(1, 'Enciende tu dispositivo ESP32'),
                  _buildStep(2, 'Conéctate a la red WiFi "WattBeaver-Setup"'),
                  _buildStep(3, 'Abre http://192.168.4.1 en tu navegador'),
                  _buildStep(4, 'Copia y pega la API Key mostrada arriba'),
                  _buildStep(5, 'Configura tu WiFi y guarda'),

                  SizedBox(height: 16),

                  // Botón para regenerar clave
                  OutlinedButton.icon(
                    icon: Icon(Icons.refresh),
                    label: Text('Regenerar API Key'),
                    onPressed: () => _showRotateKeyDialog(context, device),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.orange,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep(int number, String text) {
    return Padding(
      padding: EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$number. ',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }

  void _showRotateKeyDialog(BuildContext context, Device device) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning, color: Colors.orange),
            SizedBox(width: 8),
            Text('Advertencia'),
          ],
        ),
        content: Text(
          'Esta acción invalidará la clave actual. Tu ESP32 dejará de funcionar '
          'hasta que actualices su configuración con la nueva clave.\n\n'
          '¿Estás seguro de continuar?'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _rotateApiKey(context, device);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: Text('Regenerar'),
          ),
        ],
      ),
    );
  }

  Future<void> _rotateApiKey(BuildContext context, Device device) async {
    // Mostrar loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(child: CircularProgressIndicator()),
    );

    try {
      final response = await http.post(
        Uri.parse('https://wattnbeaver-api.wattnbeaver.site/api/v1/devices/${device.id}/rotate-key'),
        headers: {
          'Authorization': 'Bearer ${authToken}',
          'Content-Type': 'application/json',
        },
      );

      Navigator.pop(context); // Cerrar loading

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newApiKey = data['data']['device']['api_key'];

        // Mostrar la nueva clave
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('✅ API Key Regenerada'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Nueva API Key generada exitosamente:'),
                SizedBox(height: 12),
                Container(
                  padding: EdgeInsets.all(12),
                  color: Colors.grey.shade200,
                  child: SelectableText(
                    newApiKey,
                    style: TextStyle(fontFamily: 'monospace'),
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  '⚠️ Guarda esta clave antes de salir',
                  style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: newApiKey));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('API Key copiada')),
                  );
                },
                child: Text('Copiar'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  // Recargar la página del dispositivo
                },
                child: Text('Cerrar'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al regenerar API Key')),
        );
      }
    } catch (e) {
      Navigator.pop(context); // Cerrar loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error de conexión')),
      );
    }
  }
}
```

---

## 📦 Modelo de Datos Actualizado

```dart
class Device {
  final String id;
  final String userId;
  final String? householdId;
  final String deviceId;
  final String deviceName;
  final String deviceType; // 'water' o 'energy'
  final String? location;
  final String status;
  final String apiKey;  // ⬅️ NUEVO CAMPO
  final DateTime createdAt;
  final DateTime updatedAt;

  Device({
    required this.id,
    required this.userId,
    this.householdId,
    required this.deviceId,
    required this.deviceName,
    required this.deviceType,
    this.location,
    required this.status,
    required this.apiKey,  // ⬅️ NUEVO CAMPO
    required this.createdAt,
    required this.updatedAt,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'],
      userId: json['user_id'],
      householdId: json['household_id'],
      deviceId: json['device_id'],
      deviceName: json['device_name'],
      deviceType: json['device_type'],
      location: json['location'],
      status: json['status'],
      apiKey: json['api_key'],  // ⬅️ NUEVO CAMPO
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}
```

---

## 🔒 Notas de Seguridad para la App

1. **No loggear API keys**: Nunca imprimas `apiKey` en logs, analytics o servicios de crash reporting
2. **Mostrar solo cuando se solicita**: No mostrar por defecto en listados de dispositivos
3. **Advertencias claras**: Dejar muy claro que rotar la clave requiere reconfigurar el ESP32
4. **Validación de permisos**: El backend ya valida permisos, pero la app debe manejar 403/404 correctamente

---

## 📱 Dependencias de Flutter Recomendadas

```yaml
dependencies:
  qr_flutter: ^4.1.0  # Para generar código QR de la API key
  http: ^1.2.0        # Para peticiones HTTP
```

---

## ✅ Checklist de Implementación

- [ ] Actualizar modelo `Device` con campo `apiKey`
- [ ] Modificar servicio HTTP para manejar `GET /devices/:id` con api_key
- [ ] Crear método `rotateApiKey(deviceId)` en el servicio
- [ ] Diseñar pantalla de detalle del dispositivo con sección de API Key
- [ ] Implementar botón "Copiar API Key"
- [ ] Implementar QR Code generator (opcional pero recomendado)
- [ ] Implementar diálogo de confirmación para rotar clave
- [ ] Implementar flujo de rotación de clave con manejo de errores
- [ ] Agregar instrucciones de configuración WiFiManager en UI
- [ ] Testing: Verificar que el flujo completo funcione

---

## 🎯 Flujo de Usuario Completo

1. **Usuario registra dispositivo** → `POST /devices/link` con `device_id`, `device_name`, `device_type`
2. **Backend genera `api_key`** automáticamente al crear el dispositivo
3. **Usuario ve detalle** → `GET /devices/:id` → Respuesta incluye `api_key`
4. **Usuario copia o escanea QR** → La API key ahora está en su portapapeles
5. **Usuario enciende ESP32** → Se crea Access Point "WattBeaver-Setup"
6. **Usuario abre portal WiFiManager** → http://192.168.4.1
7. **Usuario pega API key** en el campo correspondiente del portal
8. **ESP32 guarda configuración** → WiFi SSID + password + api_key en SPIFFS
9. **ESP32 se conecta a WiFi** y envía datos → `POST /ingest/water` con header `X-Device-Api-Key`
10. **Backend valida api_key** → Datos se guardan en SQLite

---

## 🆘 Soporte y Troubleshooting

### Si el usuario pierde su API Key:
- **Solución**: Usar `POST /devices/:id/rotate-key` para generar una nueva
- **Consecuencia**: El ESP32 dejará de funcionar hasta reconfigurar

### Si el ESP32 no envía datos:
- **Verificar**: Que la API key en la ESP32 coincida con la mostrada en la app
- **Solución**: Regenerar clave y reconfigurar ESP32

---

**Documento generado para el equipo de Flutter de WattBeaver**
**Fecha**: 2026-03-20
**Backend API**: https://wattnbeaver-api.wattnbeaver.site/api/v1
