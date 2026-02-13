# 🐙 Guía Completa: GitHub + VSCode

Esta guía te ayudará a configurar GitHub y usar Git desde VSCode.

---

## 🌟 Ventajas de Usar GitHub

### Para Ti Como Desarrollador:
- 🌍 **Acceso Global** - Tu código disponible desde cualquier lugar
- 💼 **Portafolio Profesional** - Muestra tu trabajo a empleadores
- 🔒 **Respaldo Seguro** - Nunca perderás tu código
- 📱 **Integración con Apps** - GitHub Mobile, Desktop, etc.
- 📊 **Estadísticas** - Gráficos de commits, contribuciones
- ⭐ **Popularidad** - Otros pueden dar estrella a tu proyecto

### Para Tu Equipo:
- 👥 **Colaboración Fácil** - Múltiples personas trabajando
- 🔍 **Code Review** - Pull Requests para revisar código
- 📋 **Issues** - Sistema de tickets para bugs y features
- 🎯 **Projects** - Tablero Kanban para organizar tareas
- 💬 **Discussions** - Foro para tu proyecto
- 📈 **Wiki** - Documentación extendida

### Para Tu Proyecto WattBeaber:
- 🔗 **Backend + Frontend Separados** - Repos independientes
- 📱 **Team Flutter** - Pueden acceder a la API docs
- 🚀 **CI/CD** - GitHub Actions para deploy automático
- 🏷️ **Releases** - Versiones publicadas (v1.0.0, v1.1.0, etc.)
- 📦 **Packages** - Publicar paquetes NPM si quieres

---

## 📋 Paso 1: Crear Cuenta en GitHub

### Si NO tienes cuenta:

1. Ir a: https://github.com/signup

2. Llenar el formulario:
   ```
   Email: a22300165@ceti.mx (o el que prefieras)
   Password: (contraseña segura)
   Username: (ejemplo: wattnbeaber-team, tu-nombre, etc.)
   ```

3. Verificar email

4. Elegir plan **FREE** (es suficiente)

### Si YA tienes cuenta:
✅ Solo necesitas hacer login

---

## 🔑 Paso 2: Crear Token de Acceso (PAT)

GitHub ya no permite usar contraseña para git push. Necesitas un token.

### Pasos:

1. **Ir a Settings**
   - Click en tu foto de perfil (arriba derecha)
   - Settings

2. **Developer Settings**
   - Scroll hasta el final del menú izquierdo
   - Developer settings

3. **Personal Access Tokens**
   - Personal access tokens
   - Tokens (classic)
   - Generate new token (classic)

4. **Configurar Token**
   ```
   Note: WattBeaber Backend Access
   Expiration: 90 days (o No expiration si prefieres)

   Scopes (seleccionar):
   ✓ repo (todos los checkboxes dentro)
   ✓ workflow
   ```

5. **Generar y Copiar**
   - Click "Generate token"
   - ⚠️ **IMPORTANTE**: Copiar el token AHORA
   - Se ve así: `ghp_xxxxxxxxxxxxxxxxxxxx`
   - Solo se muestra UNA VEZ

6. **Guardar el Token de Forma Segura**
   ```bash
   # En tu servidor, guárdalo temporalmente:
   echo "GITHUB_TOKEN=ghp_tu_token_aqui" > ~/.github_token
   chmod 600 ~/.github_token
   ```

---

## 📦 Paso 3: Crear Repositorio en GitHub

### Desde la Web:

1. **New Repository**
   - Click en "+" arriba derecha
   - New repository

2. **Configurar Repositorio**
   ```
   Repository name: wattnbeaber-backend
   Description: Sistema IoT de monitoreo energético e hídrico con gamificación

   Visibility:
   ○ Public  ← Recomendado para portafolio
   ○ Private ← Si prefieres privacidad

   ⚠️ NO seleccionar:
   ☐ Add a README file
   ☐ Add .gitignore
   ☐ Choose a license

   (Ya los tenemos localmente)
   ```

3. **Create Repository**

4. **Copiar la URL**
   - Aparecerá algo como:
   ```
   https://github.com/tu-usuario/wattnbeaber-backend.git
   ```

---

## 🔗 Paso 4: Conectar tu Repositorio Local con GitHub

### Comandos a Ejecutar:

```bash
# 1. Ir a tu proyecto
cd /home/watt/wattnbeaber

# 2. Agregar GitHub como remote
git remote add origin https://github.com/TU-USUARIO/wattnbeaber-backend.git

# 3. Verificar que se agregó
git remote -v

# 4. Hacer el primer push
git push -u origin main
```

### Durante el Push te Pedirá:

```
Username: tu-usuario-github
Password: ghp_tu_token_personal (NO tu contraseña)
```

### Opción: Guardar Credenciales

Para no escribir el token cada vez:

```bash
# Opción 1: Cache por 1 hora
git config --global credential.helper cache

# Opción 2: Guardar permanente (menos seguro)
git config --global credential.helper store

# Opción 3: Usar SSH (más seguro, requiere configuración)
# Lo veremos más adelante
```

---

## 💻 Paso 5: Usar Git desde VSCode

### Extensiones Recomendadas:

1. **Git (Built-in)** - Ya viene con VSCode ✅

2. **GitLens** (Altamente Recomendada)
   ```
   Publisher: GitKraken
   ID: eamodio.gitlens
   ```

   Características:
   - Ver quién modificó cada línea
   - Historial de archivos
   - Comparar commits
   - Blame annotations

3. **Git Graph** (Opcional pero útil)
   ```
   Publisher: mhutchie
   ID: mhutchie.git-graph
   ```

   Características:
   - Gráfico visual de commits
   - Ver branches
   - Cherry-pick visual

### Cómo Instalar Extensiones:

1. Abrir VSCode
2. Click en icono de extensiones (cuadrados) o `Ctrl+Shift+X`
3. Buscar "GitLens"
4. Click "Install"
5. Repetir para "Git Graph"

---

## 🎨 Uso de Git en VSCode

### Panel de Control de Código Fuente:

```
📁 EXPLORER          (Ctrl+Shift+E)
🔍 SEARCH           (Ctrl+Shift+F)
🌿 SOURCE CONTROL   (Ctrl+Shift+G) ← GIT ESTÁ AQUÍ
🐛 RUN AND DEBUG    (Ctrl+Shift+D)
📦 EXTENSIONS       (Ctrl+Shift+X)
```

### Vista de Source Control:

Cuando abres el panel verás:

```
SOURCE CONTROL
  Changes (3)          ← Archivos modificados
    M file1.js        ← M = Modified
    A file2.js        ← A = Added
    D file3.js        ← D = Deleted

  Staged Changes (0)  ← Listos para commit
```

### Workflow Visual:

#### 1. Ver Cambios
- Click en archivo modificado
- Se abre diff visual:
  - Verde = Líneas nuevas
  - Rojo = Líneas eliminadas
  - Amarillo = Modificadas

#### 2. Stage Changes (Agregar al commit)
- Hover sobre archivo
- Click en "+" (stage)
- O "Stage All Changes" para todos

#### 3. Commit
- Escribir mensaje en caja de texto
- Click en "✓ Commit" o `Ctrl+Enter`

#### 4. Push
- Click en "..." (más opciones)
- Push
- O usar el botón de sync (↻)

---

## 🌿 Branches en VSCode

### Ver Branch Actual:
- Esquina inferior izquierda
- Muestra: `main` o el branch actual

### Crear Nueva Branch:
1. Click en "main" (abajo izquierda)
2. "Create new branch"
3. Nombre: `feature/gamificacion-automatica`
4. Enter

### Cambiar de Branch:
1. Click en nombre del branch
2. Seleccionar de la lista
3. VSCode cambia automáticamente

---

## 📊 GitLens - Características Principales

### Blame Annotations:
```javascript
// Verás junto a cada línea:
function calculate() {    // Juan, 2 días ago
  return value * 2;       // María, 1 mes ago
}
```

### File History:
- Right-click en archivo
- "Git: View File History"
- Ve todos los commits que lo modificaron

### Compare:
- Right-click en archivo
- "GitLens: Open Changes"
- Compara con versión anterior

### Hovers:
- Hover sobre cualquier línea
- Ve quién, cuándo y por qué la modificó

---

## 🔄 Workflow Diario Recomendado

### Opción A: Todo desde VSCode

```
1. Modificar archivos
2. Ver cambios en Source Control (Ctrl+Shift+G)
3. Revisar diff de cada archivo (click en archivo)
4. Stage los cambios (+ junto a cada archivo)
5. Escribir mensaje de commit
6. Commit (✓)
7. Push (... → Push)
```

### Opción B: Mixto (VSCode + Terminal)

```
VSCode:
- Ver cambios visualmente
- Revisar diffs
- Resolver conflictos

Terminal:
- git add .
- git commit -m "mensaje"
- git push
```

### Opción C: Todo en Terminal

```bash
git status
git diff
git add .
git commit -m "mensaje"
git push
```

**Recomendación:** Empieza con Opción A (todo VSCode) hasta que te sientas cómodo.

---

## 🎯 Ejemplo Práctico: Implementar Gamificación

### Paso a Paso:

**1. Crear Branch para Feature**
```
VSCode: Click en "main" → Create new branch
Nombre: feature/gamificacion-automatica
```

**2. Hacer Cambios**
```
- Editar archivos
- Crear nuevos procesadores
```

**3. Ver Cambios**
```
Ctrl+Shift+G
- Ver archivos modificados en verde/rojo
- Click en cada uno para ver diff
```

**4. Commit**
```
Source Control:
1. Stage all (+ arriba)
2. Mensaje: "Implementar procesador automático de gamificación"
3. ✓ Commit
```

**5. Push**
```
... → Push
(Primera vez pedirá publish branch)
```

**6. Crear Pull Request en GitHub**
```
GitHub web:
- Verás mensaje "Compare & pull request"
- Escribir descripción
- Create pull request
```

**7. Merge (cuando esté listo)**
```
GitHub web:
- Review de código
- Merge pull request

Local:
git checkout main
git pull
```

---

## 🔐 Configuración SSH (Opcional pero Recomendado)

### Ventajas:
- No escribir token cada vez
- Más seguro
- Más rápido

### Pasos:

#### 1. Generar SSH Key
```bash
ssh-keygen -t ed25519 -C "a22300165@ceti.mx"
# Enter para todo (sin passphrase)
```

#### 2. Copiar Clave Pública
```bash
cat ~/.ssh/id_ed25519.pub
# Copiar todo el output
```

#### 3. Agregar a GitHub
```
GitHub → Settings → SSH and GPG keys
→ New SSH key
→ Pegar clave
→ Add SSH key
```

#### 4. Cambiar Remote a SSH
```bash
git remote set-url origin git@github.com:TU-USUARIO/wattnbeaber-backend.git
```

#### 5. Probar
```bash
ssh -T git@github.com
# Debe decir: Hi username! You've successfully authenticated
```

---

## 📱 GitHub Mobile & Desktop

### GitHub Mobile App:
- iOS / Android
- Ver repositorios
- Review PRs
- Notificaciones
- Merge desde el móvil

### GitHub Desktop:
- App de escritorio
- Interfaz gráfica similar a VSCode
- Útil para quienes prefieren GUI

---

## 🎓 Recursos de Aprendizaje

### Documentación:
- GitHub Docs: https://docs.github.com
- Git Book: https://git-scm.com/book/en/v2
- GitLens Docs: https://gitlens.amod.io

### Tutoriales:
- GitHub Skills: https://skills.github.com
- Git Immersion: https://gitimmersion.com

### Videos:
- YouTube: "Git and GitHub for Beginners"
- GitHub YouTube Channel

---

## ⚠️ Mejores Prácticas

### ✅ Hacer:
- Commits pequeños y frecuentes
- Mensajes descriptivos de commit
- Push al menos una vez al día
- Usar branches para features
- Pull antes de push si trabajas en equipo
- Review tu código antes de commit

### ❌ Evitar:
- Commits gigantes con 50 archivos
- Mensajes como "fix", "cambios", "asdf"
- Subir contraseñas o tokens
- Subir node_modules
- Push --force en branch main
- Commits directos a main (usa branches)

---

## 🔍 Comandos Útiles desde VSCode Terminal

```bash
# Ver estado
git status

# Ver historial bonito
git log --oneline --graph --all

# Ver quién modificó qué
git blame archivo.js

# Buscar en historial
git log --grep="gamificación"

# Ver cambios de un commit
git show <hash>

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1
```

---

## 📊 Tu Proyecto en GitHub Se Verá Así

```
github.com/tu-usuario/wattnbeaber-backend

README.md (se muestra automáticamente)
├── 📝 Descripción
├── 🏗️ Arquitectura
├── 🚀 Instalación
├── 📡 API Endpoints
└── 🎮 Gamificación

Tabs:
- Code     ← Tu código
- Issues   ← Bugs y features
- Pull Requests ← Code review
- Actions  ← CI/CD (futuro)
- Projects ← Tablero Kanban
- Wiki     ← Docs extendidas
- Insights ← Estadísticas

Stats:
⭐ Stars
👁️ Watchers
🔀 Forks
📊 Contributors
```

---

## 🎯 Próximos Pasos

1. [ ] Crear cuenta GitHub (si no tienes)
2. [ ] Generar token de acceso
3. [ ] Crear repositorio wattnbeaber-backend
4. [ ] Conectar repo local con GitHub
5. [ ] Hacer primer push
6. [ ] Instalar extensión GitLens en VSCode
7. [ ] Explorar interfaz de Source Control
8. [ ] Hacer commit de prueba
9. [ ] Configurar SSH (opcional)
10. [ ] Crear branch para gamificación

---

**Creado:** Febrero 2026
**Proyecto:** WattBeaber
**Siguiente:** Subir a GitHub y desarrollar gamificación
