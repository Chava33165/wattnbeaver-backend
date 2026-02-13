# 📚 Guía de Uso de Git - WattBeaber

Esta guía te ayudará a trabajar con Git en el proyecto WattBeaber.

---

## 🎯 Estado Actual

```bash
✅ Repositorio Git inicializado
✅ Commit inicial creado (82 archivos)
✅ Branch principal: main
✅ .gitignore configurado
```

---

## 🔧 Comandos Básicos

### Ver el estado actual
```bash
git status
```

### Ver historial de commits
```bash
git log --oneline
git log --graph --oneline --all
```

### Ver cambios realizados
```bash
# Ver cambios no guardados
git diff

# Ver cambios en un archivo específico
git diff backend/src/models/Gamification.js
```

---

## 💾 Guardar Cambios (Commit)

### 1. Ver qué archivos cambiaron
```bash
git status
```

### 2. Agregar archivos al staging
```bash
# Agregar todos los archivos modificados
git add .

# Agregar archivos específicos
git add backend/src/models/Gamification.js
git add backend/src/processors/gamification/

# Agregar por tipo
git add *.js
```

### 3. Hacer commit
```bash
# Commit con mensaje simple
git commit -m "Agregar sistema de gamificación automática"

# Commit con mensaje detallado
git commit -m "Agregar sistema de gamificación automática

- Crear procesador automático de logros
- Conectar consumos con actualización de puntos
- Implementar cálculo de rachas
- Agregar notificaciones de logros desbloqueados
"
```

---

## 🌿 Trabajar con Ramas (Branches)

### Crear una rama para nueva funcionalidad
```bash
# Crear y cambiar a nueva rama
git checkout -b feature/gamificacion-automatica

# O en dos pasos:
git branch feature/gamificacion-automatica
git checkout feature/gamificacion-automatica
```

### Ver ramas disponibles
```bash
git branch
```

### Cambiar entre ramas
```bash
# Volver a main
git checkout main

# Ir a rama de feature
git checkout feature/gamificacion-automatica
```

### Fusionar rama con main
```bash
# 1. Ir a main
git checkout main

# 2. Fusionar la rama
git merge feature/gamificacion-automatica
```

### Eliminar rama ya fusionada
```bash
git branch -d feature/gamificacion-automatica
```

---

## 🔄 Deshacer Cambios

### Descartar cambios en un archivo (antes de commit)
```bash
git checkout -- backend/src/models/Gamification.js
```

### Descartar todos los cambios no guardados
```bash
git checkout -- .
```

### Quitar archivos del staging (sin perder cambios)
```bash
git reset backend/src/models/Gamification.js
```

### Volver al commit anterior (CUIDADO!)
```bash
# Ver commits anteriores
git log --oneline

# Volver a un commit específico
git reset --hard 81d1ea1

# Volver 1 commit atrás
git reset --hard HEAD~1
```

---

## 📊 Workflow Recomendado para Desarrollo

### Opción 1: Desarrollo Directo en Main (Proyecto Personal)
```bash
# 1. Hacer cambios en archivos
# 2. Ver qué cambió
git status
git diff

# 3. Agregar cambios
git add .

# 4. Commit
git commit -m "Descripción del cambio"
```

### Opción 2: Usar Ramas (Recomendado para Features Grandes)
```bash
# 1. Crear rama para feature
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "Implementar parte 1"
# ... más trabajo ...
git commit -m "Implementar parte 2"

# 3. Volver a main y fusionar
git checkout main
git merge feature/nueva-funcionalidad

# 4. Eliminar rama si ya no se necesita
git branch -d feature/nueva-funcionalidad
```

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Agregar gamificación automática
```bash
# Crear rama para feature
git checkout -b feature/gamificacion-automatica

# Hacer cambios en archivos...

# Ver qué cambió
git status
git diff

# Agregar archivos modificados
git add backend/src/processors/gamification/
git add backend/src/models/Gamification.js

# Commit
git commit -m "Implementar procesador automático de gamificación

- Crear GamificationProcessor.js
- Evaluar logros automáticamente al recibir lecturas
- Actualizar puntos y niveles
- Calcular rachas diarias
"

# Fusionar con main
git checkout main
git merge feature/gamificacion-automatica
```

### Ejemplo 2: Corregir un bug
```bash
# Crear rama para fix
git checkout -b fix/corregir-calculo-puntos

# Hacer corrección...

# Commit
git commit -m "Corregir cálculo de puntos en logros

El cálculo de puntos estaba duplicando los valores.
Ahora suma correctamente.
"

# Fusionar
git checkout main
git merge fix/corregir-calculo-puntos
git branch -d fix/corregir-calculo-puntos
```

---

## 📋 Convención de Nombres de Ramas

```
feature/nombre-feature    - Nueva funcionalidad
fix/nombre-bug           - Corrección de bug
hotfix/nombre-urgente    - Corrección urgente
refactor/nombre-mejora   - Refactorización
docs/nombre-docs         - Documentación
test/nombre-test         - Pruebas
```

### Ejemplos:
- `feature/flutter-integration`
- `feature/push-notifications`
- `fix/leaderboard-sorting`
- `refactor/energy-processor`
- `docs/api-endpoints`

---

## 📝 Convención de Mensajes de Commit

### Formato Recomendado:
```
Título breve (50 caracteres máx)

Descripción más detallada si es necesario.
Puede tener múltiples párrafos.

- Lista de cambios
- Otro cambio importante
- Fix para issue #123
```

### Ejemplos Buenos:
```bash
git commit -m "Agregar detección automática de logros"

git commit -m "Optimizar consultas de base de datos

- Agregar índices a energy_readings
- Usar prepared statements cacheados
- Reducir tiempo de respuesta en 40%
"

git commit -m "Fix: Corregir fuga de memoria en waterProcessor

El buffer no se limpiaba correctamente.
Ahora limita a 1000 elementos máximo.
"
```

### Ejemplos Malos (Evitar):
```bash
git commit -m "fix"
git commit -m "cambios"
git commit -m "asdf"
git commit -m "update"
```

---

## 🔍 Comandos Útiles Adicionales

### Ver contenido de un commit
```bash
git show 81d1ea1
```

### Ver quién modificó cada línea de un archivo
```bash
git blame backend/src/models/Gamification.js
```

### Ver archivos en el último commit
```bash
git show --name-only
```

### Buscar en el historial
```bash
git log --grep="gamificación"
```

### Ver estadísticas de cambios
```bash
git log --stat
```

---

## 🚨 Comandos de Emergencia

### Guardé cambios en la rama equivocada
```bash
# 1. Guardar cambios temporalmente
git stash

# 2. Cambiar a rama correcta
git checkout rama-correcta

# 3. Recuperar cambios
git stash pop
```

### Necesito volver a un commit anterior pero mantener historial
```bash
git revert 81d1ea1
```

### Borré algo por error y ya hice commit
```bash
# Ver historial
git log --oneline

# Volver al commit antes de borrar
git checkout <commit-hash> -- archivo-borrado.js
```

---

## 📦 Integración con GitHub/GitLab (Futuro)

Cuando quieras subir tu repositorio a GitHub:

```bash
# 1. Crear repo en GitHub (desde la web)

# 2. Agregar remote
git remote add origin https://github.com/usuario/wattnbeaber.git

# 3. Subir código
git push -u origin main

# 4. Para futuros cambios
git push
```

---

## ✅ Checklist Antes de Commit

- [ ] Probé que el código funciona
- [ ] No hay console.logs de debug
- [ ] No estoy subiendo contraseñas o secrets
- [ ] El mensaje de commit es descriptivo
- [ ] Agregué solo archivos relevantes (no node_modules, .env, etc)

---

## 🆘 Ayuda Rápida

```bash
git status          # ¿Qué cambió?
git diff            # ¿Qué modificaciones hay?
git log --oneline   # ¿Qué commits hay?
git branch          # ¿En qué rama estoy?
```

---

**💡 TIP:** Si tienes dudas sobre un comando, usa `git help <comando>`
Ejemplo: `git help commit`

---

**Creado:** Febrero 2026
**Proyecto:** WattBeaber
