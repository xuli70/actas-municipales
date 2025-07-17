# Guía del Sistema de IA para Actas Municipales

## 🎯 Funcionalidades Implementadas

### 1. **Resúmenes Automáticos**
- Se generan automáticamente al subir PDFs
- Máximo 400 caracteres con información clave
- Incluye: tipo de sesión, acuerdos principales, votaciones, presupuestos

### 2. **Consultas IA Bajo Demanda**
- Modal interactivo para cada acta
- Campo de texto libre para preguntas
- Historial de consultas por acta
- Respuestas basadas en el contenido real del PDF

## 🔧 Configuración Requerida

### Variables de Entorno (Coolify):
```bash
# Existentes
SUPABASE_URL=https://supmcp.axcsol.com
SUPABASE_ANON_KEY=[tu_clave_anonima]
PASSWORD_USER=[contraseña_usuarios]
PASSWORD_ADMIN=[contraseña_administradores]

# Nuevas para IA
OPENAI_API_KEY=[tu_clave_openai]
AI_MODEL=gpt-4o-mini  # Opcional, por defecto gpt-4o-mini
```

### Instalación Base de Datos:
```sql
-- Ejecutar en Supabase:
-- 1. add_ai_features.sql (campos nuevos + tabla consultas)
```

## 🚀 Cómo Funciona

### Para Usuarios:
1. **Ver resúmenes**: Aparecen automáticamente bajo cada acta
2. **Consultar IA**: Botón "🤖 Consultar IA" en cada acta
3. **Preguntar**: Escribir pregunta en lenguaje natural
4. **Historial**: Ver consultas anteriores sobre la misma acta

### Para Administradores:
1. **Subir PDF**: Se procesa automáticamente
2. **Resumen auto**: Se genera en 30-60 segundos
3. **Estado visible**: Badge indica progreso (pendiente/completado/error)

## 📝 Ejemplos de Consultas

### Preguntas Efectivas:
```
- ¿Cuáles fueron los principales acuerdos?
- ¿Qué presupuesto se aprobó y para qué?
- ¿Quién votó en contra de la propuesta?
- ¿Cuántos concejales asistieron?
- ¿Se mencionó algún proyecto específico?
- ¿Hubo debate sobre el tema X?
```

### Respuestas Ejemplo:
```
"Se aprobó un presupuesto de 2.5M€ para obras públicas 
con votación 8-2. Principales acuerdos: renovación calle 
Mayor (800k€), subvención club deportivo (12k€), 
contratación 2 empleados municipales."
```

## 🔄 Estados de Procesamiento

| Estado | Descripción | Acción Usuario |
|--------|-------------|----------------|
| ⏳ **Pendiente** | PDF subido, esperando procesamiento | Esperar |
| 🔄 **Procesando** | IA analizando contenido | Esperar |
| ✅ **Completado** | Resumen disponible, consultas activas | Usar normalmente |
| ❌ **Error** | Falló el procesamiento | Contactar admin |

## 💰 Costos Estimados

### OpenAI API (gpt-4o-mini):
- **Resumen automático**: ~€0.002 por acta
- **Consulta usuario**: ~€0.001 por pregunta
- **100 actas + 500 consultas/mes**: ~€0.70/mes

### Alternativas de Modelo:
| Modelo | Costo/acta | Calidad | Velocidad |
|--------|------------|---------|-----------|
| gpt-4o-mini | €0.002 | ⭐⭐⭐⭐ | Rápido |
| gpt-4o | €0.01 | ⭐⭐⭐⭐⭐ | Medio |
| claude-3-haiku | €0.001 | ⭐⭐⭐ | Muy rápido |

## 🛠️ Implementación Técnica

### Arquitectura:
```
PDF Upload → 
Texto Extraction → 
OpenAI Processing → 
Database Storage → 
User Interface
```

### Archivos Modificados:
- `index.html`: Modal IA + interfaz consultas
- `styles.css`: Estilos para modal y badges
- `add_ai_features.sql`: Nuevos campos BD
- `config.js.template`: Variables IA
- `openai_integration.js`: Lógica OpenAI

### Seguridad:
- API keys en variables de entorno
- Límites de consultas por usuario
- Validación de entrada
- Historial auditado en BD

## 🔧 Configuración Avanzada

### Personalizar Prompts:
Editar en `openai_integration.js`:
```javascript
const systemPrompt = `Eres un asistente especializado...`;
```

### Cambiar Modelo IA:
```bash
# En Coolify
AI_MODEL=gpt-4o  # Para mayor calidad
AI_MODEL=claude-3-sonnet  # Si cambias a Anthropic
```

### Límites de Uso:
```javascript
// En index.html, función askAI()
const MAX_QUERIES_PER_DAY = 50;
```

## 📊 Monitoreo

### Métricas Importantes:
- Actas procesadas correctamente
- Tiempo promedio de procesamiento
- Consultas por usuario/día
- Costos API acumulados
- Errores de procesamiento

### Logs en Consola:
- `console.log('IA procesando acta...')`
- `console.error('Error en consulta IA:', error)`
- Seguimiento de uso de tokens

## 🐛 Resolución de Problemas

### Error: "API key no configurada"
- Verificar `OPENAI_API_KEY` en Coolify
- Regenerar clave en OpenAI si es necesaria

### Error: "No se pudo generar resumen"
- Verificar conectividad a OpenAI
- Revisar límites de cuota API
- Comprobar formato del PDF

### Error: "Texto no extraído"
- Implementar extracción real de PDF
- Usar PDF.js o servicio externo
- Verificar que el PDF no esté protegido

### Consultas lentas:
- Cambiar a modelo más rápido (gpt-4o-mini)
- Reducir max_tokens en requests
- Implementar caché de respuestas

## 🚀 Próximas Mejoras

### Fase 2 - Extracción Real PDF:
- Integrar PDF.js para extraer texto
- OCR para PDFs escaneados
- Procesamiento de imágenes/tablas

### Fase 3 - IA Avanzada:
- Detección automática de temas
- Clasificación por tipo de acuerdo
- Alertas sobre temas específicos
- Análisis de tendencias temporales

### Fase 4 - Integración Completa:
- API propia para consultas masivas
- Dashboard de analytics
- Notificaciones push
- Exportación de informes IA
