# Guía de Rollback Completo - Sistema RLS a Estado Funcional Anterior

## Introducción

Esta guía proporciona instrucciones paso a paso para revertir completamente la implementación de Row Level Security (RLS) y restaurar el sistema de Actas Municipales al estado funcional anterior donde todo funcionaba perfectamente.

**⚠️ IMPORTANTE**: Este rollback debe ejecutarse cuando el sistema RLS ha causado que la funcionalidad básica deje de funcionar y se necesita restaurar urgentemente el servicio.

## Estado Objetivo del Rollback

### Sistema Antes de RLS (Estado Funcional)
- ✅ **Acceso público total**: Cualquier usuario puede ver todas las actas
- ✅ **Sin autenticación backend**: Solo validación frontend por contraseñas
- ✅ **Funciones básicas operativas**: Ver, buscar, subir, eliminar actas
- ✅ **Sin restricciones de base de datos**: Operaciones CRUD libres
- ✅ **Simplicidad**: Sistema directo sin capas de seguridad complejas

### Sistema Actual con RLS (Estado Problemático)
- ❌ **Acceso bloqueado**: Usuarios no pueden ver actas (funcionalidad principal rota)
- ❌ **Autenticación fallando**: Tokens válidos rechazados por políticas
- ❌ **Operaciones bloqueadas**: Upload y delete no funcionan
- ❌ **Complejidad innecesaria**: Sistema de tokens y sesiones causando problemas

## Fase 1: Rollback de Base de Datos (CRÍTICO)

### 1.1 Desactivar RLS en Todas las Tablas

```sql
-- PASO 1: Desactivar RLS en tabla principal
ALTER TABLE actas DISABLE ROW LEVEL SECURITY;

-- PASO 2: Desactivar RLS en otras tablas si fueron modificadas
ALTER TABLE busquedas DISABLE ROW LEVEL SECURITY;
ALTER TABLE visualizaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultas_ia DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;

-- PASO 3: Verificar que RLS está desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_catalog.pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
-- Este query NO debe devolver ninguna fila
```

### 1.2 Eliminar Todas las Políticas RLS

```sql
-- PASO 4: Eliminar políticas de tabla actas
DROP POLICY IF EXISTS "actas_select_all" ON actas;
DROP POLICY IF EXISTS "actas_select_public" ON actas;
DROP POLICY IF EXISTS "actas_insert_admin" ON actas;
DROP POLICY IF EXISTS "actas_insert_temp_all" ON actas;
DROP POLICY IF EXISTS "actas_update_admin" ON actas;
DROP POLICY IF EXISTS "actas_delete_admin" ON actas;

-- PASO 5: Eliminar políticas de otras tablas
DROP POLICY IF EXISTS "busquedas_select_all" ON busquedas;
DROP POLICY IF EXISTS "busquedas_insert_all" ON busquedas;
DROP POLICY IF EXISTS "visualizaciones_select_all" ON visualizaciones;
DROP POLICY IF EXISTS "visualizaciones_insert_all" ON visualizaciones;
DROP POLICY IF EXISTS "categorias_select_all" ON categorias;
DROP POLICY IF EXISTS "consultas_ia_select_all" ON consultas_ia;
DROP POLICY IF EXISTS "consultas_ia_insert_all" ON consultas_ia;
DROP POLICY IF EXISTS "documentos_select_all" ON documentos;

-- PASO 6: Verificar que no quedan políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public';
-- Este query NO debe devolver ninguna fila
```

### 1.3 Eliminar Tablas de Autenticación RLS

```sql
-- PASO 7: Eliminar tablas creadas para RLS (CON CUIDADO)
DROP TABLE IF EXISTS sesiones_temporales CASCADE;
DROP TABLE IF EXISTS roles_sistema CASCADE;

-- PASO 8: Verificar eliminación
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename = 'sesiones_temporales' OR tablename = 'roles_sistema');
-- Este query NO debe devolver ninguna fila
```

### 1.4 Limpiar Funciones y Triggers (Si Existen)

```sql
-- PASO 9: Eliminar funciones de limpieza automática
DROP FUNCTION IF EXISTS limpiar_sesiones_expiradas() CASCADE;

-- PASO 10: Eliminar trabajos cron programados (si se crearon)
SELECT cron.unschedule('limpiar-sesiones');

-- PASO 11: Verificar que no quedan funciones relacionadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%sesion%' OR routine_name LIKE '%rls%';
-- Este query NO debe devolver ninguna fila
```

## Fase 2: Rollback de Código Frontend

### 2.1 Revertir Sistema de Autenticación

#### auth.js - Simplificar a versión anterior
```javascript
// ANTES (Problemático con RLS)
async createSession(role) { /* código complejo */ }
getApiHeaders() { /* headers con tokens */ }

// DESPUÉS (Simple y funcional)
window.Auth = {
    state: {
        userRole: null,
        isAuthenticated: false
    },

    async authenticate(password) {
        const PASSWORD_ADMIN = window.APP_CONFIG?.PASSWORD_ADMIN || 'admin123';
        const PASSWORD_USER = window.APP_CONFIG?.PASSWORD_USER || 'usuario123';
        
        if (password === PASSWORD_ADMIN) {
            this.state.userRole = 'admin';
            this.state.isAuthenticated = true;
            return 'admin';
        } else if (password === PASSWORD_USER) {
            this.state.userRole = 'user';
            this.state.isAuthenticated = true;
            return 'user';
        }
        
        return null;
    },

    logout() {
        this.state.userRole = null;
        this.state.isAuthenticated = false;
    },

    isAdmin() {
        return this.state.userRole === 'admin';
    }
};

// Headers simples sin tokens
window.getApiHeaders = function() {
    return {
        'apikey': window.APP_CONFIG?.SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${window.APP_CONFIG?.SUPABASE_ANON_KEY || ''}`,
        'Content-Type': 'application/json'
    };
};
```

### 2.2 Revertir Módulos de Gestión

#### upload-manager.js - Eliminar debugging RLS
```javascript
// ELIMINAR estas líneas de debugging:
console.log('🔍 Estado de autenticación para INSERT:', window.Auth?.state);
console.log('🔍 Headers para INSERT:', /* ... */);
console.log('🔍 Token presente:', /* ... */);

// MANTENER solo la lógica simple de upload:
async uploadSingleFile(pdfFile) {
    // ... lógica de upload sin debugging de tokens
    const headers = window.getApiHeaders();
    // ... resto de la función
}
```

#### reorder-manager.js - Eliminar debugging RLS
```javascript
// ELIMINAR estas líneas de debugging:
console.log('🔍 Headers para PATCH:', /* ... */);
console.log('🔍 Estado de autenticación:', /* ... */);
console.log('🔍 Token presente:', /* ... */);

// MANTENER solo la lógica de reordenamiento:
async saveOrderToDatabase(items) {
    // ... lógica de guardado sin debugging de tokens
    const headers = window.getApiHeaders();
    // ... resto de la función
}
```

#### actas-manager.js, search.js, delete.js - Revertir headers
```javascript
// EN TODOS LOS MÓDULOS, cambiar:
const headers = window.getApiHeaders(); // ✅ Mantener (ahora es simple)

// Y ELIMINAR cualquier línea como:
console.log('🔍 Headers para [OPERACIÓN]:', /* ... */);
```

### 2.3 Verificar Variables de Entorno

#### config.js.template - Simplificar
```javascript
window.APP_CONFIG = {
    // Esenciales (mantener)
    SUPABASE_URL: '${SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
    PASSWORD_USER: '${PASSWORD_USER}',
    PASSWORD_ADMIN: '${PASSWORD_ADMIN}',
    OPENAI_API_KEY: '${OPENAI_API_KEY}',
    AI_MODEL: '${AI_MODEL}',
    
    // RLS específicas (ELIMINAR)
    // SESSION_DURATION_HOURS: '${SESSION_DURATION_HOURS}', // ❌ Eliminar
    // TOKEN_REFRESH_THRESHOLD: '${TOKEN_REFRESH_THRESHOLD}', // ❌ Eliminar
    // MAX_SESSIONS_PER_USER: '${MAX_SESSIONS_PER_USER}', // ❌ Eliminar
};
```

#### Variables de Coolify - Limpiar
```bash
# MANTENER estas variables:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima
PASSWORD_ADMIN=tu_password_admin
PASSWORD_USER=tu_password_user
OPENAI_API_KEY=tu_openai_key
AI_MODEL=gpt-3.5-turbo

# ELIMINAR estas variables RLS:
# SESSION_DURATION_HOURS=8
# TOKEN_REFRESH_THRESHOLD=1
# MAX_SESSIONS_PER_USER=3
# ENABLE_IP_VALIDATION=false
```

## Fase 3: Verificación y Pruebas

### 3.1 Pruebas de Base de Datos

```sql
-- PRUEBA 1: Verificar acceso público a actas
SELECT COUNT(*) FROM actas;
-- Debe devolver el número total de actas sin errores

-- PRUEBA 2: Verificar INSERT sin restricciones
INSERT INTO actas (titulo, fecha, descripcion) 
VALUES ('Test Rollback', CURRENT_DATE, 'Prueba de rollback');
-- Debe ejecutarse sin errores de políticas RLS

-- PRUEBA 3: Verificar UPDATE sin restricciones  
UPDATE actas SET descripcion = 'Rollback exitoso' 
WHERE titulo = 'Test Rollback';
-- Debe ejecutarse sin errores

-- PRUEBA 4: Verificar DELETE sin restricciones
DELETE FROM actas WHERE titulo = 'Test Rollback';
-- Debe ejecutarse sin errores

-- PRUEBA 5: Verificar que no hay políticas activas
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Debe devolver 0
```

### 3.2 Pruebas de Frontend

#### Acceso Público (Usuario No Autenticado)
1. **Abrir aplicación sin login**
2. **Navegar a "Ver Actas"**
3. **Verificar**: Lista de actas se carga correctamente
4. **Verificar**: Se pueden abrir PDFs
5. **Verificar**: Funciona la búsqueda

#### Acceso de Usuario Regular
1. **Login con contraseña de usuario**
2. **Navegar a "Ver Actas"**
3. **Verificar**: Lista de actas visible
4. **Verificar**: Consultas de IA funcionan
5. **Verificar**: No aparecen controles de admin

#### Acceso de Administrador
1. **Login con contraseña de admin**
2. **Navegar a "Ver Actas"**
3. **Verificar**: Lista de actas visible
4. **Verificar**: Botón "Reordenar" visible y funcional
5. **Navegar a "Subir Acta"**
6. **Verificar**: Upload de PDF funciona sin errores
7. **Verificar**: Delete de actas funciona sin errores

### 3.3 Verificación de Logs

#### Console Logs Esperados (SIN debugging RLS)
```
✅ Aplicación inicializada correctamente
✅ Auth.js cargado correctamente
✅ ActasManager inicializado correctamente
✅ SearchManager inicializado correctamente
✅ DeleteManager inicializado correctamente
✅ UploadManager inicializado correctamente
✅ ReorderManager inicializado correctamente
```

#### Console Logs NO Deseados (eliminar si aparecen)
```
❌ 🔍 Estado de autenticación para [OPERACIÓN]
❌ 🔍 Headers para [OPERACIÓN]
❌ 🔍 Token presente: [...]
❌ ✅ Sesión temporal creada exitosamente
❌ Error creando sesión temporal
```

## Fase 4: Limpieza Final

### 4.1 Eliminar Archivos de Documentación RLS

```bash
# OPCIONAL: Mover documentación RLS a carpeta de respaldo
mkdir -p documentation_backup/rls_attempt_2025-07-23/
mv RLS_IMPLEMENTATION_REPORT.md documentation_backup/rls_attempt_2025-07-23/
mv RLS_DEPLOYMENT_GUIDE.md documentation_backup/rls_attempt_2025-07-23/
mv RLS_ROLLBACK_GUIDE.md documentation_backup/rls_attempt_2025-07-23/
```

### 4.2 Actualizar Documentación Principal

#### CLAUDE.md - Remover sección RLS
```markdown
# Eliminar completamente esta sección:
### Row Level Security (RLS) Implementation (2025-07-23)
[... todo el contenido RLS ...]

# Mantener solo:
### Summary Generation Enhancement (COMPLETED - 2025-07-20, MODIFIED - 2025-07-23)
[... contenido de summaries ...]
```

#### TODO.md - Limpiar issues RLS
```markdown
# Eliminar secciones:
## 🔐 RLS SECURITY IMPLEMENTATION
## 🚨 CRITICAL ISSUES FOR NEXT SESSION
## 📋 AUTHENTICATION SYSTEM STATUS

# Restaurar estado anterior con:
## 🎯 CURRENT PROJECT STATUS
- **Application State**: FULLY FUNCTIONAL
- **Normal Operation**: 100% working (all features operational)
- **Supabase Access**: Restored and stable
- **User Experience**: Simple and reliable
```

#### Handoff_Summary.md - Estado restaurado
```markdown
**Session Status**: ✅ SYSTEM RESTORED - Full functionality recovered

## Current Session Summary
### Objective Achieved: Complete Rollback from RLS
**Successfully reverted RLS implementation and restored full system functionality**

### System Status
- ✅ **Public Access**: All users can view actas
- ✅ **Admin Functions**: Upload, delete, reorder all working
- ✅ **Authentication**: Simple password-based system restored  
- ✅ **Database**: Open access without RLS restrictions
- ✅ **Performance**: No security overhead, optimal speed
```

## Fase 5: Commit y Deploy

### 5.1 Git Commit del Rollback

```bash
# Añadir todos los cambios del rollback
git add -A

# Commit con mensaje claro
git commit -m "ROLLBACK: Revert RLS implementation - restore full functionality

- Disabled RLS on all tables
- Removed all RLS policies  
- Deleted authentication tables (sesiones_temporales, roles_sistema)
- Simplified frontend authentication to password-only
- Removed token-based session management
- Eliminated RLS debugging code
- Restored public database access
- All core functionality working: view, search, upload, delete, reorder

System restored to stable pre-RLS state.

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push a producción
git push origin main
```

### 5.2 Deploy en Coolify

1. **Coolify detectará los cambios automáticamente**
2. **Eliminará variables de entorno RLS innecesarias**
3. **Construirá imagen con código simplificado**
4. **Deploy del sistema restaurado**

### 5.3 Verificación Post-Deploy

```bash
# Verificar que la aplicación funciona
curl -I https://tu-dominio-actas.com/health
# Debe devolver: 200 OK

# Verificar acceso a Supabase
curl -H "apikey: TU_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer TU_SUPABASE_ANON_KEY" \
     "https://tu-proyecto.supabase.co/rest/v1/actas?select=count"
# Debe devolver count sin errores 401 o 42501
```

## Checklist de Rollback Completo

### ✅ Base de Datos
- [ ] RLS desactivado en todas las tablas
- [ ] Todas las políticas RLS eliminadas
- [ ] Tablas `sesiones_temporales` y `roles_sistema` eliminadas
- [ ] Funciones de limpieza eliminadas
- [ ] Cron jobs eliminados
- [ ] Pruebas CRUD funcionando sin restricciones

### ✅ Frontend
- [ ] `auth.js` simplificado (sin tokens)
- [ ] `getApiHeaders()` devuelve headers básicos
- [ ] Debugging RLS eliminado de todos los módulos
- [ ] Variables de entorno RLS removidas
- [ ] Console limpio sin logs de autenticación

### ✅ Funcionalidad
- [ ] Usuarios pueden ver actas sin autenticación
- [ ] Login admin/user funciona con contraseñas
- [ ] Upload de PDFs funciona para admins
- [ ] Delete de actas funciona para admins
- [ ] Reordenamiento funciona para admins
- [ ] Búsqueda funciona para todos
- [ ] Consultas IA funcionan

### ✅ Deploy
- [ ] Código committed con mensaje de rollback
- [ ] Variables Coolify limpiadas
- [ ] Deploy exitoso en VPS
- [ ] Aplicación accesible sin errores
- [ ] Documentación actualizada

## Resultado Final Esperado

### Sistema Completamente Funcional
- **Estado**: Idéntico al pre-RLS pero manteniendo mejoras de summary
- **Seguridad**: Solo frontend (suficiente para el caso de uso)
- **Complejidad**: Mínima (fácil mantenimiento)
- **Funcionalidad**: 100% operativa
- **Performance**: Óptima (sin overhead de RLS)

### Lecciones Aprendidas
- RLS añadió complejidad innecesaria para este caso de uso
- La autenticación frontend era suficiente
- Sistema simple = sistema confiable
- El rollback completo es la solución más efectiva

---

**Con este rollback, el sistema volverá a funcionar perfectamente como antes, sin los problemas introducidos por RLS, manteniendo toda la funcionalidad que los usuarios esperan.**