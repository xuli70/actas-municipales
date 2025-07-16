# =================================
# DOCKERFILE ACTAS MUNICIPALES v1.0.0
# Aplicación para personas mayores - Actas del Ayuntamiento
# Basado en app-base v1.0.3
# Soporte completo UTF-8 para caracteres españoles
# =================================
FROM node:18-alpine

LABEL maintainer="xuli70"
LABEL description="Aplicación de actas municipales para personas mayores"
LABEL version="1.0.0"

# Configurar localización y UTF-8 para caracteres españoles
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV LANGUAGE=C.UTF-8

WORKDIR /app

# Instalar Caddy
RUN apk add --no-cache caddy

# Copiar TODOS los archivos del proyecto
COPY . .

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

# Comando de inicio
CMD ["caddy", "run", "--config", "/app/Caddyfile", "--adapter", "caddyfile"]
