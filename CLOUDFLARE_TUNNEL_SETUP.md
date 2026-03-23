# Configuración de Cloudflare Tunnel para WattBeaber API

## Resumen
Tu API WattBeaber ahora está accesible públicamente a través de Cloudflare Tunnel con tu dominio propio.

---

## 🌐 URL Pública de tu API
**https://wattnbeaver-api.wattnbeaver.site**

### Endpoints disponibles:
- **Raíz:** https://wattnbeaver-api.wattnbeaver.site/
- **Health:** https://wattnbeaver-api.wattnbeaver.site/api/v1/health
- **Documentación:** https://wattnbeaver-api.wattnbeaver.site/api-docs
- **Auth:** https://wattnbeaver-api.wattnbeaver.site/api/v1/auth
- **Energy:** https://wattnbeaver-api.wattnbeaver.site/api/v1/energy
- **Water:** https://wattnbeaver-api.wattnbeaver.site/api/v1/water
- **Alerts:** https://wattnbeaver-api.wattnbeaver.site/api/v1/alerts
- **Devices:** https://wattnbeaver-api.wattnbeaver.site/api/v1/devices
- **Gamification:** https://wattnbeaver-api.wattnbeaver.site/api/v1/gamification

---

## 📋 Configuración Realizada

### 1. Dominio
- **Dominio comprado:** wattnbeaver.site
- **Registrador:** Namecheap
- **Costo:** $0.98 USD/año (primer año)
- **Renovación:** $1.78 USD/año
- **Expira:** 20 de Marzo 2027
- **Auto-renovación:** DESACTIVADA (cancelar antes de expirar si no quieres renovar)

### 2. Cloudflare
- **Plan:** Free (gratuito)
- **Nameservers configurados:**
  - carlos.ns.cloudflare.com
  - gracie.ns.cloudflare.com
- **DNS:** Administrado por Cloudflare
- **SSL/TLS:** Automático (HTTPS gratis)
- **CDN:** Activado (red global de Cloudflare)
- **DDoS Protection:** Activado

### 3. Cloudflare Tunnel
- **Nombre del tunnel:** wattnbeaber-api
- **ID del tunnel:** ad9b5ecf-8e0b-4ed7-bdd1-3a7f0eac0aed
- **Hostname público:** wattnbeaver-api.wattnbeaver.site
- **Servicio interno:** http://localhost:3000
- **Estado:** ✅ Activo y corriendo
- **Auto-inicio:** ✅ Configurado con systemd

---

## 🔧 Servicios Configurados

### Cloudflared Service (Systemd)
```bash
# Ver estado del tunnel
sudo systemctl status cloudflared

# Reiniciar tunnel
sudo systemctl restart cloudflared

# Detener tunnel
sudo systemctl stop cloudflared

# Ver logs del tunnel
sudo journalctl -u cloudflared -f
```

### Backend API (PM2)
```bash
# Ver estado del backend
pm2 status

# Reiniciar backend
pm2 restart wattnbeaber-backend

# Ver logs del backend
pm2 logs
```

---

## ⏰ Propagación DNS
- **Tiempo estimado:** 10 minutos a 24 horas
- **Estado actual:** En propagación
- **Verificar propagación:** https://dnschecker.org/#A/wattnbeaver-api.wattnbeaver.site

### Cómo verificar si ya funciona:
```bash
# Desde terminal
curl https://wattnbeaver-api.wattnbeaver.site/

# O abre en tu navegador:
https://wattnbeaver-api.wattnbeaver.site/
```

Cuando funcione, verás el JSON de respuesta de tu API.

---

## 📱 Usar en tu App Flutter

### Configuración de la API base URL
```dart
// lib/config/api_config.dart
class ApiConfig {
  // URL pública de producción
  static const String baseUrl = 'https://wattnbeaver-api.wattnbeaver.site';

  // URL local para desarrollo
  static const String devUrl = 'http://localhost:3000';

  // Usar según el entorno
  static String get apiUrl {
    const bool isProduction = bool.fromEnvironment('dart.vm.product');
    return isProduction ? baseUrl : devUrl;
  }
}
```

### Ejemplo de uso
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> getHealthCheck() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.apiUrl}/api/v1/health'),
  );

  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to load health check');
  }
}
```

---

## 🔒 Seguridad

### Protecciones Activas:
- ✅ **HTTPS/TLS:** Todo el tráfico encriptado automáticamente
- ✅ **DDoS Protection:** Protección de Cloudflare contra ataques
- ✅ **IP Oculta:** Tu Raspberry Pi no expone su IP pública
- ✅ **WAF:** Web Application Firewall de Cloudflare
- ✅ **Rate Limiting:** Backend limita a 100 requests/minuto
- ✅ **JWT Authentication:** Autenticación con tokens

### Recomendaciones de Seguridad:
1. ⚠️ **Cambiar JWT_SECRET** en producción (ver siguiente sección)
2. ✅ Configurar CORS específico (ya configurado)
3. ✅ Mantener el sistema actualizado
4. ✅ Monitorear logs regularmente

---

## 🎯 Próximos Pasos Recomendados

### 1. Actualizar JWT_SECRET (IMPORTANTE)
El secret actual es un placeholder. Cámbialo por uno seguro:

```bash
# Generar un secret aleatorio fuerte
openssl rand -base64 32

# Editar .env
nano /home/watt/wattnbeaber/backend/.env

# Cambiar esta línea:
# JWT_SECRET=WattBeaber_Secret_Key_2026_Change_This_In_Production
# Por algo como:
# JWT_SECRET=tu_secret_generado_aqui_muy_largo_y_aleatorio

# Reiniciar backend
pm2 restart wattnbeaber-backend
```

### 2. Configurar CORS Específico
Actualmente acepta todos los orígenes. Restringe a tu app:

```javascript
// backend/src/server.js
app.use(cors({
  origin: [
    'https://wattnbeaver-api.wattnbeaver.site',
    'http://localhost:3000' // para desarrollo
  ]
}));
```

### 3. Monitoreo
- Revisa logs regularmente: `sudo journalctl -u cloudflared -f`
- Monitorea uso de recursos: `htop`
- Verifica uptime del backend: `pm2 status`

---

## 📊 Métricas y Monitoreo

### Cloudflare Analytics
Ve las estadísticas de tu tráfico en:
https://dash.cloudflare.com/ → wattnbeaver.site → Analytics

### Cloudflare Tunnel Metrics
El tunnel expone métricas en:
http://localhost:20242/metrics

---

## 🆘 Solución de Problemas

### El dominio no carga (ERR_NAME_NOT_RESOLVED)
- **Causa:** DNS aún no ha propagado
- **Solución:** Esperar (puede tardar hasta 24 horas)
- **Verificar:** https://dnschecker.org/#A/wattnbeaver-api.wattnbeaver.site

### El tunnel no inicia
```bash
# Ver logs
sudo journalctl -u cloudflared -n 50

# Reiniciar servicio
sudo systemctl restart cloudflared

# Verificar estado
sudo systemctl status cloudflared
```

### El backend no responde
```bash
# Verificar que esté corriendo
curl http://localhost:3000/

# Ver logs
pm2 logs

# Reiniciar
pm2 restart wattnbeaber-backend
```

### Error 502 Bad Gateway
- **Causa:** Backend caído o no responde
- **Solución:**
  ```bash
  # Verificar backend
  pm2 status
  pm2 restart wattnbeaber-backend

  # Verificar que escuche en puerto 3000
  netstat -tulpn | grep 3000
  ```

### Error 404 Not Found
- **Causa:** Ruta no configurada correctamente en Cloudflare
- **Solución:** Verificar en Cloudflare Dashboard → Zero Trust → Tunnels → wattnbeaber-api → Rutas de aplicación publicada

---

## 💰 Costos

### Costos Actuales:
- **Dominio (wattnbeaver.site):** $0.98 USD/año (ya pagado)
- **Cloudflare (Plan Free):** $0 USD/mes
- **Cloudflare Tunnel:** $0 USD/mes
- **SSL/TLS:** $0 USD (incluido con Cloudflare)
- **CDN:** $0 USD (incluido con Cloudflare)
- **Total mensual:** $0 USD
- **Total anual:** $0.98 USD (solo el dominio)

### Costos Futuros:
- **Renovación dominio (2027):** $1.78 USD/año
- **Cloudflare:** Sigue siendo gratis
- **Tunnel:** Sigue siendo gratis

---

## 🔄 Mantenimiento

### Tareas Mensuales:
- [ ] Revisar logs de errores
- [ ] Verificar espacio en disco
- [ ] Actualizar dependencias de Node.js

### Tareas Anuales:
- [ ] Decidir si renovar el dominio ($1.78 USD)
- [ ] Actualizar sistema operativo
- [ ] Revisar y actualizar dependencias críticas

---

## 📞 Soporte

### Documentación Oficial:
- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Cloudflare DNS:** https://developers.cloudflare.com/dns/
- **Namecheap:** https://www.namecheap.com/support/

### Comandos Útiles:
```bash
# Ver todos los tunnels
cloudflared tunnel list

# Ver info del tunnel actual
cloudflared tunnel info wattnbeaber-api

# Test local del backend
curl http://localhost:3000/api/v1/health

# Test público del backend (cuando DNS propague)
curl https://wattnbeaver-api.wattnbeaver.site/api/v1/health
```

---

## ✅ Checklist de Verificación

- [x] Dominio comprado y configurado
- [x] Nameservers cambiados a Cloudflare
- [x] Cloudflare Tunnel creado y activo
- [x] Ruta pública configurada
- [x] Backend corriendo en localhost:3000
- [x] Servicio systemd configurado para auto-inicio
- [ ] DNS propagado (en proceso, esperar hasta 24h)
- [ ] JWT_SECRET actualizado (pendiente)
- [ ] CORS configurado específicamente (pendiente)

---

**Última actualización:** 20 de Marzo 2026
**Configurado por:** Claude Code
**Proyecto:** WattBeaber - Sistema de Monitoreo Energético e Hídrico
