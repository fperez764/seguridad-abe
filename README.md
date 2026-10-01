# ️ Sistema de Seguridad y Menús Dinámicos ABE

## 📋 Tabla de Contenidos
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Base de Datos (Schema `abeseg`)](#base-de-datos-schema-abeseg)
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Endpoints de la API](#endpoints-de-la-api)
- [Troubleshooting](#troubleshooting)
- [Roadmap a Producción](#roadmap-a-producción)

---

## Resumen Ejecutivo

Sistema empresarial de **Gestión de Identidad y Accesos (IAM)** con renderizado de interfaz dinámica. El sistema autentica usuarios corporativos mediante un flujo de **2 pasos (LDAP + OTP por correo)**, consulta una matriz de permisos en base de datos PostgreSQL y renderiza un menú lateral en el frontend que decide inteligentemente entre enrutar a módulos internos (React Router) o redirigir a sistemas externos (SSO/Web).

### Características Principales
- ✅ Autenticación corporativa contra Active Directory (LDAP)
- ✅ Doble factor de autenticación (2FA) con OTP enviado por correo
- ✅ Menú dinámico basado en roles y permisos (JSONB)
- ✅ Auditoría completa de intentos de autenticación
- ✅ Enrutamiento inteligente (rutas internas vs sistemas externos)
- ✅ Arquitectura escalable con API Gateway

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL USUARIO                     │
│                    (React + Vite + Tailwind)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Nginx)                     │
│              (Proxy Inverso + SSL + Rate Limiting)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌───────────────────────┐   ┌───────────────────────────────┐
│   IAM SEGURIDAD ABE   │   │   OTROS MICROSERVICIOS        │
│   (NestJS + JWT)      │   │   (Futuros módulos)           │
└───────────┬───────────┘   └───────────────────────────────┘
            │
     ┌──────┴──────┬──────────────┬──────────────┐
     ▼             ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐
│  LDAP   │ │   SMTP   │ │ PostgreSQL│ │   Redis    │
│ (AD)    │ │(Nodemailer)│ │(abeseg)  │ │  (Futuro)  │
└─────────┘ └──────────┘ └───────────┘ └────────────
```

---

## Stack Tecnológico

### Backend (`iam-seguridad-abe`)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | 10.x | Framework backend |
| **TypeScript** | 5.x | Lenguaje (ESM estricto) |
| **TypeORM** | 0.3.x | ORM para PostgreSQL |
| **PostgreSQL** | 15+ | Base de datos (Schema `abeseg`) |
| **ldapauth-fork** | 1.5.x | Autenticación LDAP |
| **Nodemailer** | 6.x | Envío de correos OTP |
| **@nestjs/jwt** | 10.x | Generación de tokens JWT |
| **@nestjs/config** | 3.x | Variables de entorno |

### Frontend (`frontend-web`)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.x | Framework UI |
| **Vite** | 5.x | Build tool y dev server |
| **TypeScript** | 5.x | Lenguaje (Strict mode) |
| **TailwindCSS** | 4.x | Estilos utilitarios |
| **Zustand** | 4.x | Estado global (con persistencia) |
| **TanStack Query** | 5.x | Fetching de datos |
| **React Router** | 6.x | Enrutamiento SPA |
| **Lucide React** | - | Iconografía |
| **Axios** | 1.x | Cliente HTTP |

### Infraestructura
- **SO:** AlmaLinux 9 (RHEL based)
- **Proxy:** Nginx (producción)
- **Firewall:** firewalld
- **Proces Manager:** PM2 (producción)

---

## Estructura del Repositorio

```
seguridad-abe/
├── .gitignore
├── README.md
── DEPLOYMENT.md
├── api-gateway/
│   ├── src/
│   ── package.json
├── frontend-web/
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.tsx          # Menú dinámico
│   │   ├── hooks/
│   │   │   └── useUserMenu.ts       # Query del menú
│   │   ├── pages/
│   │   │   └── Login.tsx            # Login 2 pasos
│   │   ├── services/
│   │   │   └── authService.ts       # Cliente API
│   │   ├── store/
│   │   │   ── authStore.ts         # Zustand store
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── iam-seguridad-abe/
    ├── src/
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.controller.ts
    │   │   │   ├── auth.service.ts
    │   │   │   ├── auth.module.ts
    │   │   │   ├── ldap.service.ts      # Integración LDAP
    │   │   │   └── otp.service.ts       # Envío OTP
    │   │   ├── iam/
    │   │   │   ├── entities/
    │   │   │   │   ├── usuario.entity.ts
    │   │   │   │   └── log-autenticacion.entity.ts
    │   │   │   └── services/
    │   │   │       ├── usuario.service.ts
    │   │   │       └── log-autenticacion.service.ts
    │   │   ── menu/
    │   │       ├── menu.controller.ts
    │   │       ├── menu.service.ts
    │   │       └── menu.module.ts
    │   ├── app.module.ts
    │   └── main.ts
    ├── .env.example
    └── package.json
```

---

## Base de Datos (Schema `abeseg`)

### Diagrama Relacional

```
seg_usuario ──────┐
                  ├──> seg_asignacion_acceso ──> seg_rol ──> seg_rol_modulo_permiso ──> seg_modulo
seg_ambito ───────┘                                    │
seg_area ──────────────────────────────────────────────┘

seg_log_autenticacion (Tabla independiente de auditoría)
```

### Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| `seg_usuario` | Catálogo de usuarios (sincronizado con LDAP) |
| `seg_rol` | Roles del sistema (Admin, Consultor, etc.) |
| `seg_modulo` | Ítems del menú (con `ruta_ui` y `base_url`) |
| `seg_asignacion_acceso` | Pivote: Usuario → Rol → Ámbito → Área |
| `seg_rol_modulo_permiso` | Permisos JSONB por rol y módulo |
| `seg_ambito` / `seg_area` | Estructura organizacional |
| `seg_log_autenticacion` | Auditoría de intentos de login |

### Campo JSONB de Permisos
```json
{
  "ver": true,
  "crear": true,
  "editar": false,
  "borrar": false
}
```

---

## Flujo de Autenticación

### Paso 1: Credenciales LDAP
```
Usuario → [Usuario + Contraseña] → Backend
Backend → Valida contra LDAP (192.168.238.46)
Backend → Busca/crea usuario en seg_usuario
Backend → Genera JWT temporal (5 min)
Backend → Genera OTP de 6 dígitos
Backend → Envía OTP por correo (SMTP)
Backend → Registra log en seg_log_autenticacion
```

### Paso 2: Validación OTP
```
Usuario → [Código OTP] → Backend
Backend → Valida OTP contra memoria (Map)
Backend → Genera JWT final (24h)
Backend → Registra log exitoso
Frontend → Guarda token en localStorage (Zustand)
Frontend → Redirige al Dashboard
```

### Paso 3: Carga de Menú
```
Frontend → GET /api/v1/iam/users/:id/menu (con JWT)
Backend → Valida JWT (JwtAuthGuard)
Backend → Consulta: usuario → asignación → rol → permisos → módulos
Backend → Retorna JSON con menú dinámico
Frontend → Renderiza Sidebar con rutas internas/externas
```

---

## Instalación y Configuración

### Requisitos Previos
- Node.js 18+ y npm 9+
- PostgreSQL 15+ con acceso al schema `abeseg`
- Servidor LDAP accesible desde la VM
- Servidor SMTP configurado

### Backend
```bash
cd iam-seguridad-abe
npm install
cp .env.example .env
# Editar .env con las credenciales reales
npm run start:dev
```

### Frontend
```bash
cd frontend-web
npm install
npm run dev
# Acceder a http://192.168.238.46:pppp
```

---

## Variables de Entorno

### Backend (`iam-seguridad-abe/.env`)
```env
# Base de Datos
DB_HOST=192.168.238.60
DB_PORT=5432
DB_USER=postgres
DB_PASS=********
DB_NAME=gestion

# JWT
JWT_SECRET=tu_secret_super_seguro_aqui

# LDAP
LDAP_URL=ldap://192.168.238.xx
LDAP_BIND_DN=uid=freddy.perez,ou=people,dc=abe,dc=bo
LDAP_BIND_PASSWORD=********
LDAP_SEARCH_BASE=ou=people,dc=abe,dc=bo
LDAP_SEARCH_FILTER=(uid={{username}})

# SMTP
SMTP_HOST=mail.abe.bo
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@abe.bo
SMTP_PASS=********
SMTP_FROM="Sistema de Seguridad ABE" <no-reply@abe.bo>
```

### Frontend (`frontend-web/.env`)
```env
VITE_API_URL=http://192.168.238.60:3001
```

---

## Endpoints de la API

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Paso 1: Validar LDAP y enviar OTP | No |
| POST | `/auth/verify-otp` | Paso 2: Validar OTP y generar JWT | No |
| GET | `/api/v1/iam/users/:userId/menu` | Obtener menú dinámico | Sí (JWT) |

---

## Troubleshooting

### Error: `EADDRINUSE: address already in use :::3001`
```bash
sudo fuser -k 3001/tcp
npm run start:dev
```

### Error: `ERR_ADDRESS_UNREACHABLE`
```bash
sudo firewall-cmd --zone=public --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

### Error: `el valor nulo en la columna «usu_cre» viola la restricción`
Verificar que el `LogAutenticacionService` incluya `usuCre` y `fecCre` en el insert.

### El menú no se actualiza tras insertar datos en BD
```javascript
// En la consola del navegador (F12)
localStorage.clear()
```

---

## Roadmap a Producción

- [ ] Configurar Nginx como proxy inverso (puerto 443)
- [ ] Implementar PM2 para gestión de procesos
- [ ] Integrar LDAP con cuenta de servicio dedicada
- [ ] Configurar SMTP con contraseña de aplicación
- [ ] Implementar panel de auditoría en frontend
- [ ] Agregar permisos granulares en UI (botones crear/editar/borrar)
- [ ] Configurar CI/CD con GitLab CI
- [ ] Implementar Redis para cache de OTP
- [ ] Agregar rate limiting en API Gateway

---

## Licencia

Propietario - Agencia Boliviana de Espacio (ABE)

## Contacto

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.
