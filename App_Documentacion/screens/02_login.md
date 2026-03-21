# Login Screen

## 📄 Descripción
Pantalla de inicio de sesión para usuarios existentes.

## 🎯 Objetivo
- Autenticar usuarios con email y contraseña
- Guardar token JWT para futuras sesiones
- Redirigir al Dashboard tras login exitoso

## 🎨 Elementos Visuales

### Componentes UI

1. **Header**
   - Logo pequeño (top)
   - Título: "Bienvenido a WattBeaber"
   - Subtítulo: "Inicia sesión para continuar"

2. **Form**
   - Campo Email (con validación)
   - Campo Password (obscureText)
   - Checkbox "Recordarme"
   - Link "¿Olvidaste tu contraseña?"

3. **Botones**
   - Botón principal: "Iniciar Sesión" (verde)
   - Botón secundario: "Crear cuenta" (outline)

4. **Footer**
   - Versión de la app
   - Link términos y condiciones

### Estados del Botón
- **Normal**: Verde (#4CAF50)
- **Loading**: Spinner + texto "Iniciando..."
- **Disabled**: Gris (si form inválido)

## 🔄 Flujo de Navegación

```
Login Screen
    ├─> (login exitoso) → Dashboard
    ├─> (click "Crear cuenta") → Registro
    └─> (click "Olvidé contraseña") → Recuperación (v2.0)
```

## 🌐 API Integration

### Endpoint
```
POST /api/v1/auth/login
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response (Success)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-123",
      "name": "Juan Pérez",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

## ✅ Validaciones

### Email
- No vacío
- Formato válido (regex)
- Mensaje error: "Email inválido"

### Password
- No vacío
- Mínimo 6 caracteres
- Mensaje error: "La contraseña debe tener al menos 6 caracteres"

## 📱 Código de Referencia

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await ApiService.login(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (response.success) {
        // Guardar token
        await StorageService.saveToken(response.data.token);

        // Navegar a Dashboard
        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        _showError(response.message);
      }
    } catch (e) {
      _showError('Error de conexión');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}
```

## 🔒 Seguridad

- [ ] No guardar contraseña en plain text
- [ ] Usar HTTPS para requests
- [ ] Limpiar campos después de error
- [ ] Rate limiting (backend ya lo tiene)
- [ ] Validar token antes de guardar

## ⚠️ Manejo de Errores

| Error | Mensaje Usuario | Acción |
|-------|-----------------|--------|
| 401 Unauthorized | "Email o contraseña incorrectos" | Limpiar password |
| 500 Server Error | "Error del servidor, intenta más tarde" | Mostrar SnackBar |
| Network Error | "Sin conexión a internet" | Botón reintentar |
| Timeout | "La solicitud tardó demasiado" | Reintentar |

## ✅ Criterios de Aceptación

- [ ] Validaciones funcionan correctamente
- [ ] Muestra errores de forma clara
- [ ] Loading state visible durante request
- [ ] Token se guarda correctamente
- [ ] Navegación a Dashboard funciona
- [ ] No se puede enviar form inválido
- [ ] Keyboard se oculta al enviar
- [ ] Responsive en diferentes tamaños

## 🎨 Assets Necesarios

- Logo WattBeaber (pequeño)
- Iconos: email, lock, visibility

## 📝 Notas

- Considerar agregar login con Google/Facebook en v2.0
- Implementar biometría (fingerprint/face) en v2.0
