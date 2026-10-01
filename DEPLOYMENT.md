# 🚀 Guía de Despliegue - Sistema de Seguridad ABE

Este documento contiene las instrucciones para desplegar el sistema en un entorno de producción.

## Tabla de Contenidos
- [Requisitos de Infraestructura](#requisitos-de-infraestructura)
- [Configuración del Servidor](#configuración-del-servidor)
- [Despliegue del Backend](#despliegue-del-backend)
- [Despliegue del Frontend](#despliegue-del-frontend)
- [Configuración de Nginx](#configuración-de-nginx)
- [Configuración de Firewall](#configuración-de-firewall)
- [Gestión de Procesos con PM2](#gestión-de-procesos-con-pm2)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Backup de Base de Datos](#backup-de-base-de-datos)
- [Actualizaciones](#actualizaciones)

---

## Requisitos de Infraestructura

### Servidor de Aplicación
| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disco | 50 GB SSD | 100 GB SSD |
| SO | AlmaLinux 9 | AlmaLinux 9 |

### Servicios Externos Requeridos
- **PostgreSQL 15+**: Base de datos con schema `abeseg`
- **Servidor LDAP**: Active Directory corporativo (ej: 192.168.238.46)
- **Servidor SMTP**: Correo corporativo (ej: mail.abe.bo)
- **Certificado SSL**: Para HTTPS (Let's Encrypt o corporativo)

---

## Configuración del Servidor

### 1. Actualizar el sistema
```bash
sudo dnf update -y
sudo dnf install -y epel-release
```

### 2. Instalar Node.js 18
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
node --version  # Debe mostrar v18.x.x
```

### 3. Instalar PM2 globalmente
```bash
sudo npm install -g pm2
```

### 4. Instalar Nginx
```bash
sudo dnf install -y nginx
sudo systemctl enable nginx
```

---

## Despliegue del Backend

### 1. Clonar el repositorio
```bash
cd /opt
sudo git clone https://gitlab.com/tu-usuario/seguridad-abe.git
sudo chown -R $USER:$USER seguridad-abe
```

### 2. Configurar variables de entorno
```bash
cd /opt/seguridad-abe/iam-seguridad-abe
cp .env.example .env
nano .env
# Configurar todas las variables con valores de producción
```

### 3. Instalar dependencias
```bash
npm install --production
```

### 4. Compilar el proyecto
```bash
npm run build
```

### 5. Iniciar con PM2
```bash
pm2 start dist/main.js --name "iam-seguridad-abe"
pm2 save
pm2 startup
```

---

## Despliegue del Frontend

### 1. Instalar dependencias y compilar
```bash
cd /opt/seguridad-abe/frontend-web
npm install
npm run build
```

### 2. Los archivos estáticos estarán en:
```
/opt/seguridad-abe/frontend-web/dist/
```

---

## Configuración de Nginx

### 1. Crear configuración del sitio
```bash
sudo nano /etc/nginx/conf.d/seguridad-abe.conf
```

### 2. Contenido del archivo
```nginx
# Frontend (React SPA)
server {
    listen 80;
    server_name seguridad.abe.bo;
    
    root /opt/seguridad-abe/frontend-web/dist;
    index index.html;
    
    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Auth Proxy
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Validar y reiniciar Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar SSL con Let's Encrypt (opcional)
```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seguridad.abe.bo
```

---

## Configuración de Firewall

```bash
# Abrir puertos HTTP y HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# NO abrir el puerto 3001 (solo accesible desde localhost)
sudo firewall-cmd --reload

# Verificar
sudo firewall-cmd --list-all
```

---

## Gestión de Procesos con PM2

### Comandos útiles
```bash
# Ver estado de procesos
pm2 status

# Ver logs en tiempo real
pm2 logs iam-seguridad-abe

# Reiniciar aplicación
pm2 restart iam-seguridad-abe

# Detener aplicación
pm2 stop iam-seguridad-abe

# Monitoreo en tiempo real
pm2 monit
```

### Configuración de reinicio automático
```bash
# Guardar lista de procesos
pm2 save

# Configurar inicio automático al reiniciar el servidor
pm2 startup
```

---

## Monitoreo y Logs

### Logs de la aplicación
```bash
# Ver logs del backend
pm2 logs iam-seguridad-abe --lines 100

# Logs en archivo
pm2 logs iam-seguridad-abe --out /var/log/seguridad-abe/app.log
```

### Logs de Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Logs de PostgreSQL
```bash
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log
```

---

## Backup de Base de Datos

### Script de backup automático
```bash
#!/bin/bash
# /opt/seguridad-abe/scripts/backup.sh

BACKUP_DIR="/var/backups/seguridad-abe"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="gestion"
DB_USER="postgres"

mkdir -p $BACKUP_DIR

pg_dump -U $DB_USER -d $DB_NAME -n abeseg --format=custom > $BACKUP_DIR/abeseg_$DATE.dump

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "abeseg_*.dump" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/abeseg_$DATE.dump"
```

### Configurar cronjob
```bash
crontab -e
# Agregar: 0 2 * * * /opt/seguridad-abe/scripts/backup.sh >> /var/log/seguridad-abe/backup.log 2>&1
```

---

## Actualizaciones

### Proceso de actualización
```bash
# 1. Ir al directorio del proyecto
cd /opt/seguridad-abe

# 2. Obtener últimos cambios
git pull origin main

# 3. Actualizar backend
cd iam-seguridad-abe
npm install --production
npm run build
pm2 restart iam-seguridad-abe

# 4. Actualizar frontend
cd ../frontend-web
npm install
npm run build

# 5. Verificar estado
pm2 status
```

### Rollback en caso de error
```bash
# Ver historial de commits
git log --oneline -10

# Volver a versión anterior
git checkout <commit-hash>

# Reconstruir y reiniciar
cd iam-seguridad-abe
npm run build
pm2 restart iam-seguridad-abe
```

---

## Checklist de Producción

- [ ] Variables de entorno configuradas correctamente
- [ ] Certificado SSL instalado y vigente
- [ ] Firewall configurado (solo puertos 80/443 abiertos)
- [ ] PM2 configurado con reinicio automático
- [ ] Backups de base de datos automatizados
- [ ] Logs centralizados y monitoreados
- [ ] Cuenta de servicio LDAP configurada
- [ ] Contraseña de aplicación SMTP configurada
- [ ] Pruebas de penetración realizadas
- [ ] Documentación de incidentes actualizada

---

## Soporte

Para problemas de despliegue, contactar al equipo de DevOps o revisar los logs en:
- Backend: `pm2 logs iam-seguridad-abe`
- Nginx: `/var/log/nginx/error.log`
- PostgreSQL: `/var/lib/pgsql/15/data/log/`