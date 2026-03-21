# Splash Screen

## 📄 Descripción
Pantalla inicial que se muestra mientras la app carga y verifica el estado de autenticación.

## 🎯 Objetivo
- Mostrar branding de WattBeaber
- Verificar si el usuario ya está autenticado (token JWT válido)
- Redirigir al Dashboard o Login según corresponda

## 🎨 Elementos Visuales

### Contenido
- Logo de WattBeaber (centrado)
- Nombre de la app
- Tagline: "Monitorea, Ahorra, Gana"
- Loading indicator (circular, verde/azul)

### Animaciones
- Fade-in del logo (300ms)
- Rotación suave del loading indicator

## 🔄 Flujo de Navegación

```
Splash Screen
    ├─> (si tiene token válido) → Dashboard
    └─> (si no tiene token) → Login
```

## ⏱️ Duración
- Mínimo: 1.5 segundos (para mostrar branding)
- Máximo: 3 segundos (timeout)

## 💾 Verificaciones

1. Leer token de SharedPreferences
2. Si existe token:
   - Validar expiración (jwt_decoder)
   - Verificar conectividad
   - Intentar renovar si está por expirar
3. Si no existe o es inválido:
   - Limpiar SharedPreferences
   - Ir a Login

## 📱 Código de Referencia

```dart
class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(Duration(seconds: 2));

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');

    if (token != null) {
      // Validar y navegar a Dashboard
      Navigator.pushReplacementNamed(context, '/dashboard');
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }
}
```

## ✅ Criterios de Aceptación

- [ ] Logo se muestra correctamente
- [ ] Animación fluida (60fps)
- [ ] Redirección funciona correctamente
- [ ] Maneja casos sin internet
- [ ] No se puede volver atrás (pop bloqueado)

## 🎨 Assets Necesarios

- `logo_wattnbeaber.png` (512x512)
- `logo_text.png` (opcional)

## 📝 Notas

- Esta pantalla no requiere estado complejo
- Considerar usar `flutter_native_splash` package para optimización
