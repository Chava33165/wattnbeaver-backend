# 🌊⚡ WattBeaber - Sistema de Monitoreo Energético e Hídrico

Sistema IoT para monitoreo en tiempo real de consumo de energía y agua, con gamificación integrada para promover el ahorro de recursos.

## 📋 Descripción

WattBeaber es una plataforma completa que permite:
- 📊 Monitorear consumo de energía y agua en tiempo real
- 🚨 Recibir alertas de consumo anormal y fugas
- 🎮 Ganar puntos y logros por ahorro de recursos
- 📱 Visualizar estadísticas y reportes detallados
- 🏆 Competir con otros usuarios en una tabla de posiciones

## 🏗️ Arquitectura

```
┌─────────────────┐
│  App Flutter    │ 📱 Interfaz móvil
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  Backend API    │ 🖥️ Node.js + Express
│  (Este Repo)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│SQLite│  │ MQTT  │ 💾 Datos + 📡 IoT
└──────┘  └───┬───┘
              │
         ┌────▼─────┐
         │Raspberry │ 🔌 Dispositivos
         │   Pi     │
         └──────────┘
```

## 🚀 Tecnologías

### Backend
- **Node.js** (>= 20.0.0)
- **Express** - Framework web
- **SQLite** (better-sqlite3) - Base de datos
- **MQTT** - Comunicación IoT
- **JWT** - Autenticación
- **Swagger** - Documentación API

### IoT
- **Raspberry Pi** - Controlador principal
- **Sensores de flujo** - Medición de agua
- **Sonoff** - Medición de energía

## 📦 Instalación

```bash
# 1. Clonar repositorio
git clone <url-del-repo>
cd wattnbeaber/backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional)
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Iniciar servidor
npm start

# O para desarrollo con auto-reload:
npm run dev
```

## ⚙️ Configuración

El servidor se configura mediante variables de entorno o usa valores por defecto:

```env
# Servidor
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=backend_user
MQTT_PASSWORD=backend_password

# JWT
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=24h

# Base de datos
DB_PATH=../data/wattnbeaber.db
```

## 📡 API Endpoints

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `GET /api/v1/auth/me` - Perfil actual

### Energía
- `GET /api/v1/energy` - Lecturas de energía
- `GET /api/v1/energy/stats` - Estadísticas
- `GET /api/v1/energy/cost` - Costo estimado

### Agua
- `GET /api/v1/water` - Lecturas de agua
- `GET /api/v1/water/stats` - Estadísticas
- `GET /api/v1/water/leaks` - Detección de fugas

### Gamificación
- `GET /api/v1/gamification/profile` - Perfil (puntos, nivel, racha)
- `GET /api/v1/gamification/achievements` - Logros
- `GET /api/v1/gamification/challenges` - Retos
- `POST /api/v1/gamification/challenges/start` - Iniciar reto
- `GET /api/v1/gamification/leaderboard` - Tabla de posiciones

### Reportes
- `GET /api/v1/reports/daily` - Reporte diario
- `GET /api/v1/reports/weekly` - Reporte semanal
- `GET /api/v1/reports/monthly` - Reporte mensual

### Alertas
- `GET /api/v1/alerts` - Ver alertas
- `PUT /api/v1/alerts/:id/acknowledge` - Reconocer alerta
- `PUT /api/v1/alerts/:id/resolve` - Resolver alerta

### Documentación Completa
📚 [http://localhost:3000/api-docs](http://localhost:3000/api-docs) - Swagger UI

## 🎮 Sistema de Gamificación

### Niveles
- Nivel 1: 0-99 puntos
- Nivel 2: 100-299 puntos
- Nivel 3: 300-599 puntos
- ...hasta Nivel 10

### Logros Disponibles
- 🏆 **Primera Semana** (100 pts) - Completa tu primera semana
- 💰 **Ahorrador Principiante** (150 pts) - Reduce 10% en una semana
- 💎 **Ahorrador Experto** (300 pts) - Reduce 20% en una semana
- 🔥 **Racha de 7 días** (200 pts) - 7 días bajo objetivo
- 🔥 **Racha de 30 días** (500 pts) - 30 días bajo objetivo
- 💧 **Sin Fugas** (250 pts) - Un mes sin fugas

### Retos
- ⚡ Reduce 15% esta semana (200 pts)
- 💧 Ahorra 100 litros (150 pts)

## 🗄️ Base de Datos

SQLite con las siguientes tablas principales:

- `users` - Usuarios del sistema
- `devices` - Dispositivos IoT registrados
- `energy_readings` - Lecturas de consumo eléctrico
- `water_readings` - Lecturas de consumo de agua
- `alerts` - Alertas y notificaciones
- `user_gamification` - Perfil de gamificación
- `achievements` - Logros disponibles
- `user_achievements` - Logros desbloqueados
- `challenges` - Retos disponibles
- `user_challenges` - Retos activos

## 📱 Integración con Flutter

El backend está diseñado para trabajar con una app móvil Flutter:

```dart
// Ejemplo de llamada desde Flutter
final response = await http.get(
  Uri.parse('$baseUrl/api/v1/gamification/profile'),
  headers: {'Authorization': 'Bearer $token'},
);
```

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Bcrypt para passwords
- ✅ Helmet para headers HTTP seguros
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validación de inputs

## 📊 Procesamiento de Datos

El sistema incluye procesadores en memoria para análisis en tiempo real:

- **Energy Processor**: Detección de picos, tendencias, costos
- **Water Processor**: Detección de fugas, patrones de consumo
- **Alert Manager**: Reglas automáticas de alertas

## 🚦 Estado del Proyecto

- [x] Backend API completo
- [x] Sistema de autenticación
- [x] Lectura de sensores vía MQTT
- [x] Almacenamiento en base de datos
- [x] Sistema de alertas
- [x] Reportes diarios/semanales/mensuales
- [x] Estructura de gamificación
- [ ] Gamificación automática (en desarrollo)
- [ ] App móvil Flutter (en desarrollo)
- [ ] Sistema de notificaciones push
- [ ] Dashboard web

## 👥 Equipo

**WattBeaber Team** - Proyecto CETI

## 📄 Licencia

MIT License

## 🔗 Links

- Documentación API: http://localhost:3000/api-docs
- Repositorio: (agregar URL cuando se suba a GitHub)

---

**Versión:** 1.0.0
**Última actualización:** Febrero 2026
