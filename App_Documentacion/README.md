# WattBeaber - Documentación de App Móvil

## 📱 Visión General

Aplicación móvil Flutter para monitoreo en tiempo real de consumo energético e hídrico con sistema de gamificación integrado.

## 🎯 Objetivo

Permitir a los usuarios:
- Monitorear consumo de energía y agua en tiempo real
- Recibir alertas de consumo anormal
- Gestionar dispositivos IoT
- Participar en sistema de gamificación (logros, retos, puntos)
- Visualizar reportes y estadísticas

## 📂 Estructura de Documentación

```
App_Documentacion/
├── README.md                          # Este archivo
├── screens/                           # Documentación de pantallas
│   ├── 01_splash.md
│   ├── 02_login.md
│   ├── 03_registro.md
│   ├── 04_dashboard.md
│   ├── 05_dispositivos.md
│   ├── 06_detalle_dispositivo.md
│   ├── 07_energia_detail.md
│   ├── 08_agua_detail.md
│   ├── 09_alertas.md
│   ├── 10_gamificacion.md
│   ├── 11_perfil.md
│   └── 12_configuracion.md
├── architecture/                      # Arquitectura técnica
│   ├── state_management.md
│   ├── folder_structure.md
│   └── dependencies.md
├── api/                               # Integración API
│   ├── endpoints.md
│   ├── auth_flow.md
│   └── mqtt_integration.md
└── assets/                            # Recursos de diseño
    ├── colors.md
    ├── typography.md
    └── icons.md
```

## 🚀 Stack Tecnológico

- **Framework**: Flutter 3.x
- **Lenguaje**: Dart
- **State Management**: Provider
- **HTTP Client**: http package
- **MQTT**: mqtt_client
- **Charts**: fl_chart
- **Storage**: shared_preferences

## 📋 Features Principales

### MVP (v1.0)
- [ ] Autenticación (Login/Registro)
- [ ] Dashboard principal
- [ ] Monitoreo en tiempo real (MQTT)
- [ ] Gestión de dispositivos
- [ ] Alertas y notificaciones
- [ ] Sistema de gamificación
- [ ] Perfil de usuario

### Futuro (v2.0)
- [ ] Modo oscuro
- [ ] Multi-idioma
- [ ] Reportes exportables (PDF)
- [ ] Compartir logros en redes sociales
- [ ] Comparación con vecinos
- [ ] Predicciones con ML

## 🎨 Diseño

- **Tema**: Material Design 3
- **Colores primarios**: Verde (energía), Azul (agua)
- **Tipografía**: Roboto
- **Iconos**: Material Icons + Custom

## 📅 Timeline Estimado

- **Semana 1**: Setup + Autenticación + Dashboard básico
- **Semana 2**: Dispositivos + Tiempo real (MQTT)
- **Semana 3**: Gamificación + Alertas
- **Semana 4**: Pulido + Testing + Deploy

---

**Última actualización**: 14 de Febrero, 2026
**Versión**: 0.1.0 (Planificación)
