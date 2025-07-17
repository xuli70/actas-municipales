# =================================
# DOCKERFILE ACTAS MUNICIPALES v2.0.0
# Aplicaci?n para personas mayores - Actas del Ayuntamiento
# Soporte completo UTF-8 para caracteres espa?oles
# Variables de entorno din?micas
# =================================
FROM node:18-alpine

LABEL maintainer="xuli70"
LABEL description="Aplicaci?n de actas municipales para personas mayores"
LABEL version="2.0.0"

# Configurar localizaci?n y UTF-8 para caracteres espa?oles
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV LANGUAGE=C.UTF-8

# Variables de entorno por defecto (se sobrescriben en Coolify)
ENV SUPABASE_URL=https://supmcp.axcsol.com
ENV SUPABASE_ANON_KEY=""

WORKDIR /app

# Instalar Caddy, wget para healthcheck y envsubst para variables
RUN apk add --no-cache caddy wget gettext

# Copiar TODOS los archivos del proyecto
COPY . .

# Script para generar config.js desde variables de entorno
RUN echo '#!/bin/sh' > /app/generate-config.sh && \
    echo 'echo "Generando config.js con variables de entorno..."' >> /app/generate-config.sh && \
    echo 'envsubst < /app/config.js.template > /app/config.js' >> /app/generate-config.sh && \
    echo 'echo "config.js generado exitosamente"' >> /app/generate-config.sh && \
    chmod +x /app/generate-config.sh

# Crear Caddyfile ULTRA-SIMPLE para Coolify con UTF-8
RUN echo -e ":${PORT:-8080} {\n\
    root * /app\n\
    file_server\n\
    try_files {path} /index.html\n\
    encode gzip\n\
    header Content-Type text/html; charset=utf-8\n\
    log {\n\
        output stdout\n\
        format console\n\
    }\n\
}" > /app/Caddyfile

# Puerto 8080 (REQUERIDO por Coolify)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Script de inicio que genera config.js y luego inicia Caddy
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Iniciando aplicaci?n Actas Municipales..."' >> /app/start.sh && \
    echo '/app/generate-config.sh' >> /app/start.sh && \
    echo 'echo "Iniciando servidor Caddy..."' >> /app/start.sh && \
    echo 'exec caddy run --config /app/Caddyfile --adapter caddyfile' >> /app/start.sh && \
    chmod +x /app/start.sh

# Comando de inicio
CMD ["/app/start.sh"]
