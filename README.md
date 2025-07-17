# Actas Municipales - Ayuntamiento

## ?? Descripci?n

Aplicaci?n web para la gesti?n y visualizaci?n de actas municipales del ayuntamiento. Dise?ada especialmente para personas mayores con interfaz accesible, fuentes grandes y contraste alto.

## ? Caracter?sticas Principales

- **Interfaz Accesible**: Dise?ada para personas mayores
- **Carga de PDFs**: Sistema completo de carga de actas en formato PDF
- **Categorizaci?n**: Sistema de categor?as para organizar las actas
- **B?squeda Avanzada**: B?squeda de texto completo en espa?ol
- **Almacenamiento en Supabase**: Base de datos y almacenamiento de archivos
- **Responsive**: Funciona en dispositivos m?viles y escritorio

## ? Estado del Proyecto

- ? **Completado**: 
  - Esquema de base de datos completo
  - Interfaz de usuario accesible
  - Sistema de carga de archivos
  - Integraci?n con Supabase Storage
  - Sistema de categor?as
  - Docker configurado para deployment

- ? **Pendiente**:
  - Funcionalidad de b?squeda
  - Visualizaci?n de categor?as en la lista
  - Sistema de notificaciones

## ?? Stack Tecnol?gico

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Base de Datos**: Supabase (PostgreSQL)
- **Almacenamiento**: Supabase Storage
- **Servidor**: Caddy
- **Deployment**: Docker + Coolify

## ? Esquema de Base de Datos

### Tablas Principales:

1. **actas**: Tabla principal con toda la informaci?n de las actas
2. **categorias**: Cat?logo de categor?as (Presupuesto, Obras P?blicas, etc.)
3. **actas_categorias**: Relaci?n muchos a muchos
4. **visualizaciones**: Registro de visualizaciones
5. **busquedas**: Analytics de b?squedas

## ? Configuraci?n

### Variables de Entorno

```bash
# En Coolify configurar:
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Desarrollo Local

1. Clonar el repositorio
2. Copiar `config.js.example` a `config.js`
3. Actualizar las credenciales en `config.js`
4. Abrir `index.html` en un navegador

### Deployment con Docker

```bash
# Build
docker build -t actas-municipales .

# Run con variables de entorno
docker run -p 8080:8080 \
  -e SUPABASE_URL=https://tuproyecto.supabase.co \
  -e SUPABASE_ANON_KEY=tu_key \
  actas-municipales
```

## ? Notas Importantes

### Caracteres Espa?oles

Para evitar problemas con caracteres especiales, usar entidades HTML:
- ? ? `&ntilde;`
- ? ? `&aacute;`
- ? ? `&eacute;`
- etc.

### Storage en Supabase

El bucket `actas-pdfs` debe estar configurado como p?blico y con las pol?ticas RLS deshabilitadas para desarrollo.

## ? Documentaci?n Adicional

- [Gu?a de Errores de Supabase](./SUPABASE_ERROR_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## ? Autor

Desarrollado por xuli70

## ? Licencia

Proyecto privado - Todos los derechos reservados
