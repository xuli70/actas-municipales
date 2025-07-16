📄 Actas Municipales - Aplicación para Personas Mayores
Aplicación web móvil ultra-simple para que personas mayores puedan consultar las actas de los plenos municipales del Ayuntamiento.

🎯 Características
✅ Interfaz ultra-simple: Botones grandes, texto claro, navegación intuitiva
✅ Optimizada para móviles: Diseño responsive que funciona en cualquier dispositivo
✅ Accesible: Alto contraste, fuentes grandes, navegación simple
✅ Integración con Supabase: Base de datos y almacenamiento en la nube
✅ Gestión de PDFs: Carga y visualización de actas en formato PDF
✅ Basada en app-base: Utiliza la estructura probada de tu repositorio base
🚀 Instalación Rápida
Prerrequisitos
Cuenta en Supabase con:
Base de datos configurada
Tabla actas creada
Storage bucket para PDFs
Clave anónima (anon key)
VPS con Coolify instalado
Paso 1: Configurar Supabase
Ve a tu proyecto en Supabase
En Settings → API, copia tu anon key
Crea un bucket llamado actas en Storage (público)
Paso 2: Clonar y Configurar
bash
# Clonar el repositorio
git clone https://github.com/xuli70/actas-municipales.git
cd actas-municipales

# Editar app.js y añadir tu clave de Supabase
# Busca la línea: const SUPABASE_ANON_KEY = 'TU_CLAVE_ANONIMA_AQUI';
# Reemplaza con tu clave real
Paso 3: Estructura de Archivos
actas-municipales/
├── index.html       # Página principal con todo integrado
├── app.js          # Lógica de la aplicación
├── styles.css      # Estilos optimizados
├── Dockerfile      # Configuración Docker
├── README.md       # Este archivo
└── .gitignore      # Archivos a ignorar
Paso 4: Subir a GitHub
bash
git add .
git commit -m "Primera versión de actas municipales"
git push origin main
Paso 5: Deploy en Coolify
En Coolify, crear nueva aplicación
Seleccionar: Build Pack: Dockerfile
Conectar con tu repositorio GitHub
Puerto: 8080
Deploy!
📱 Uso de la Aplicación
Para Usuarios (Personas Mayores)
Abrir la aplicación en el móvil
Tocar "Ver Actas" (botón azul grande)
Seleccionar un acta de la lista
Se abre el PDF automáticamente
Para Administradores
Tocar "Subir Nueva Acta" (botón verde)
Rellenar formulario:
Número de sesión (ej: 2024/001)
Fecha del pleno
Tipo (Ordinario/Extraordinario)
Seleccionar archivo PDF
Tocar "Subir Acta"
Esperar confirmación
🔧 Configuración Avanzada
Personalizar Colores
Edita styles.css:

css
/* Cambiar color principal */
.btn {
    background-color: #tu-color-aqui;
}

/* Cambiar color del header */
header {
    background: #tu-color-aqui;
}
Cambiar Título
Edita index.html:

html
<h1>Tu Ayuntamiento</h1>
<p class="subtitle">Plenos Municipales</p>
Límite de Tamaño PDF
En app.js, línea ~250:

javascript
const maxSize = 10 * 1024 * 1024; // Cambiar a 20MB: 20 * 1024 * 1024
🐛 Solución de Problemas
Error: "No se pueden cargar las actas"
Verifica tu clave de Supabase en app.js
Comprueba que la tabla actas existe
Revisa permisos RLS en Supabase
Error: "PDF muy grande"
Comprimir PDF antes de subir
Aumentar límite en app.js
Verificar límites de Supabase Storage
Caracteres españoles mal mostrados
Ya solucionado con entidades HTML
Si persiste, verificar UTF-8 en Dockerfile
📊 Base de Datos
La tabla actas debe tener esta estructura:

sql
CREATE TABLE actas (
    id SERIAL PRIMARY KEY,
    numero_sesion VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    tipo_pleno VARCHAR(100) DEFAULT 'Ordinario',
    pdf_url TEXT,
    estado VARCHAR(30) DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
🔐 Seguridad
✅ Headers de seguridad configurados en Caddy
✅ Validación de archivos PDF
✅ Límite de tamaño de archivos
✅ Sin datos sensibles en el código
🤝 Soporte
Si necesitas ayuda:

Revisa el archivo TROUBLESHOOTING.md de app-base
Verifica la documentación de Supabase
Comprueba los logs en Coolify
📄 Licencia
Proyecto de código abierto para uso municipal.

Creado por: xuli70
Basado en: app-base v1.0.3
Versión: 1.0.0
Estado: ✅ Listo para producción

