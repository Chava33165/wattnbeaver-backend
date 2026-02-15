# Registro Screen

## 📄 Descripción
Pantalla de registro para nuevos usuarios.

## 🎯 Objetivo
- Permitir a nuevos usuarios crear una cuenta
- Validar datos antes de enviar
- Crear usuario y autenticar automáticamente

## 🎨 Elementos Visuales

### Componentes UI

1. **Header**
   - Título: "Crear Cuenta"
   - Subtítulo: "Únete a WattBeaber"

2. **Form**
   - Campo Nombre completo
   - Campo Email
   - Campo Contraseña
   - Campo Confirmar Contraseña
   - Checkbox "Acepto términos y condiciones"

3. **Botones**
   - Botón principal: "Registrarse"
   - Link: "¿Ya tienes cuenta? Inicia sesión"

### Indicador de Fortaleza de Contraseña
- Débil (rojo): < 6 caracteres
- Media (amarillo): 6-10 caracteres
- Fuerte (verde): > 10 caracteres + mayúsculas + números

## 🔄 Flujo de Navegación

```
Registro Screen
    ├─> (registro exitoso) → Dashboard
    └─> (click "Inicia sesión") → Login
```

## 🌐 API Integration

### Endpoint
```
POST /api/v1/auth/register
```

### Request Body
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-456",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user"
    }
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

## ✅ Validaciones

### Nombre
- No vacío
- Mínimo 3 caracteres
- Solo letras y espacios
- Mensaje error: "Nombre debe tener al menos 3 caracteres"

### Email
- No vacío
- Formato válido
- Verificar disponibilidad (opcional: debounce)
- Mensaje error: "Email inválido o ya registrado"

### Contraseña
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos un número
- Mensaje error: "Contraseña debe tener 8+ caracteres, mayúsculas y números"

### Confirmar Contraseña
- Debe coincidir con contraseña
- Mensaje error: "Las contraseñas no coinciden"

### Términos
- Debe estar aceptado
- Mensaje error: "Debes aceptar los términos y condiciones"

## 📱 Código de Referencia

```dart
class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _acceptTerms = false;
  bool _isLoading = false;

  String _getPasswordStrength() {
    final password = _passwordController.text;
    if (password.length < 6) return 'Débil';
    if (password.length < 10) return 'Media';
    if (password.contains(RegExp(r'[A-Z]')) &&
        password.contains(RegExp(r'[0-9]'))) return 'Fuerte';
    return 'Media';
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_acceptTerms) {
      _showError('Debes aceptar los términos');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await ApiService.register(
        name: _nameController.text,
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (response.success) {
        await StorageService.saveToken(response.data.token);
        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        _showError(response.message);
      }
    } catch (e) {
      _showError('Error al registrar usuario');
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
```

## 🔒 Seguridad

- [ ] Hashear contraseña en backend (bcrypt)
- [ ] Validar email único en servidor
- [ ] No enviar contraseña en logs
- [ ] Rate limiting en backend
- [ ] Sanitizar inputs

## ⚠️ Manejo de Errores

| Error | Mensaje Usuario | Acción |
|-------|-----------------|--------|
| Email duplicado | "Este email ya está registrado" | Sugerir login |
| Validación fallida | "Verifica los datos ingresados" | Resaltar campos |
| Server error | "Error del servidor" | Reintentar |
| Network error | "Sin conexión" | Mostrar offline |

## ✅ Criterios de Aceptación

- [ ] Todas las validaciones funcionan
- [ ] Indicador de fortaleza de contraseña
- [ ] No permite registro sin aceptar términos
- [ ] Muestra errores claros
- [ ] Auto-login después de registro
- [ ] Campos se limpian después de error
- [ ] Responsive design

## 🎨 Assets Necesarios

- Iconos: person, email, lock, check_circle

## 📝 Notas

- Considerar verificación de email en v2.0
- Agregar captcha si hay spam en v2.0
- Permitir registro con redes sociales en v2.0
