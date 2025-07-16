# Dockerfile v1.0.4 - Aplicación Actas Municipales
FROM caddy:2.7-alpine

# Configurar UTF-8
ENV LANG=es_ES.UTF-8
ENV LC_ALL=es_ES.UTF-8

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de la aplicación
COPY index.html /app/
COPY admin.html /app/
COPY viewer.html /app/
COPY app.js /app/
COPY styles.css /app/

# Crear Caddyfile inline con configuración UTF-8
RUN echo -e ":8080 {\n\
    root * /app\n\
    file_server\n\
    encode gzip\n\
    header Content-Type text/html\n\
    header Cache-Control no-cache\n\
    header X-Content-Type-Options nosniff\n\
    header X-Frame-Options DENY\n\
    header X-XSS-Protection \"1; mode=block\"\n\
    log {\n\
        output stdout\n\
    }\n\
}" > /etc/caddy/Caddyfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

# Exponer puerto 8080 (requerido por Coolify)
EXPOSE 8080

# Comando para iniciar Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]