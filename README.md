# 🛡️ Sistema de Seguridad y Menús Dinámicos ABE

## 1. Resumen Ejecutivo
Sistema empresarial de Gestión de Identidad y Accesos (IAM) con renderizado de interfaz dinámica. El sistema autentica usuarios corporativos mediante un flujo de 2 pasos (LDAP + OTP), consulta una matriz de permisos en base de datos y renderiza un menú lateral en el frontend que decide inteligentemente entre enrutar a módulos internos (React) o redirigir a sistemas externos (SSO/Web).

## 2. Stack Tecnológico

### Backend (API REST)
* **Framework:** NestJS (Node.js)
* **Lenguaje:** TypeScript (Configuración Estricta / ESM `NodeNext`)
* **ORM:** TypeORM
* **Base de Datos:** PostgreSQL (Schema personalizado `abeseg`)
* **Seguridad:** Passport.js (LDAP), JWT (`@nestjs/jwt`), Guards y Decoradores personalizados.
* **Configuración:** `@nestjs/config` (Variables de entorno).

### Frontend (SPA)
* **Framework:** React 18+ con Vite
* **Lenguaje:** TypeScript (Strict mode, `verbatimModuleSyntax`)
* **Estilos:** TailwindCSS v4
* **Estado Global:** Zustand (con persistencia en `localStorage`)
* **Fetching de Datos:** TanStack Query (React Query) + Axios
* **Enrutamiento:** React Router DOM
* **Iconografía:** Lucide React

### Infraestructura y DevOps
* **SO:** AlmaLinux (RHEL based)
* **Servidor Web/Proxy:** Nginx
* **Firewall:** `firewalld`

---

## 3. Arquitectura de Base de Datos (Schema `abeseg`)

El modelo relacional está diseñado para soportar matrices de acceso granulares a nivel de Área, Ámbito, Rol y Módulo.

* **`seg_ambito` / `seg_area`**: Estructura organizacional (Ej: Sede Central, TI).
* **`seg_usuario`**: Catálogo de usuarios (sincronizado con LDAP).
* **`seg_rol`**: Roles del sistema (Ej: Admin, Consultor).
* **`seg_modulo`**: Ítems del menú. Contiene `ruta_ui` (ruta interna) y `base_url` (si tiene valor, el frontend lo trata como sistema externo).
* **`seg_asignacion_acceso`**: Tabla pivote que asigna Usuario -> Rol -> Ámbito -> Área.
* **`seg_rol_modulo_permiso`**: Asigna permisos a los roles por módulo. Utiliza el tipo **`JSONB`** de PostgreSQL para almacenar permisos flexibles (ej: `{"ver": true, "crear": false}`).

---

## 4. Flujo de Autenticación y Autorización

### 4.1. Flujo de Login (2 Pasos)
1. **Paso 1 (Credenciales):** El frontend envía `ldapUid` y `password`. El backend valida contra LDAP (simulado en pruebas) y busca/crea el usuario en `abeseg.seg_usuario`. Si es exitoso, devuelve un **Token Temporal** (JWT de 5 min) y solicita OTP.
2. **Paso 2 (OTP):** El frontend envía el Token Temporal y el código de 6 dígitos. El backend valida el OTP. Si es correcto, emite el **Token de Sesión Final** (JWT de 24h) y los datos del usuario.

### 4.2. Protección de Rutas (Guards)
* **`JwtAuthGuard`**: Intercepta todas las peticiones a `/api/v1/iam/*`. Valida el Bearer Token en el header. Si es inválido, retorna `401 Unauthorized`.
* **`AccessControlGuard`** (Preparado para Fase 3): Lee el decorador `@RequireAccess('TI', 'CENTRAL', 'ADMIN')` en los controladores y valida los permisos JSONB contra la base de datos.

---

## 5. Lógica del Frontend: Menú Dinámico Inteligente

El componente `Sidebar.tsx` es el núcleo de la experiencia de usuario. Consume el JSON de permisos y utiliza la siguiente lógica de enrutamiento:

```typescript
const handleMenuClick = (item: MenuItem) => {
  if (item.isExternal) {
    // Si el módulo tiene base_url (ej: clientes.abe.bo), redirección total del navegador
    window.location.href = item.url; 
  } else {
    // Si es un módulo interno, usa React Router para SPA sin recargar
    navigate(item.url); 
  }
};
```

---

## 6. Infraestructura y Despliegue en AlmaLinux

### 6.1. Configuración de Puertos y Firewall
Para permitir la comunicación entre el navegador del cliente y los servicios en la VM:

```bash
# Abrir puerto del Backend (NestJS)
sudo firewall-cmd --zone=public --add-port=3001/tcp --permanent

# Abrir puerto del Frontend (Vite Dev Server)
sudo firewall-cmd --zone=public --add-port=5173/tcp --permanent

# Recargar firewall
sudo firewall-cmd --reload
```

### 6.2. Configuración de CORS y Vite
* **Backend (`main.ts`):** Se habilitó `app.enableCors()` para aceptar peticiones desde el dominio/IP del frontend.
* **Frontend (`vite.config.ts`):** Se configuró `server: { host: true }` para que Vite escuche en `0.0.0.0` y sea accesible desde la red local, no solo desde `localhost`.

---

## 7. Bitácora de Errores y Soluciones (Troubleshooting)

*Esta sección es vital para el mantenimiento futuro y para nuevos desarrolladores que se unan al equipo.*

| Error / Síntoma | Causa Raíz | Solución Aplicada |
| :--- | :--- | :--- |
| **`Cannot find module '../decorators/...'`** | Configuración ESM (`NodeNext`) en `tsconfig.json`. | Agregar la extensión `.js` en los imports locales (ej: `import { X } from './x.js'`). |
| **`'Strategy' can only be imported by using a default import`** | Librería `passport-ldapauth` usa `export default`. | Cambiar `import { Strategy }` por `import LdapPassportStrategy`. |
| **`Type 'string \| undefined' is not assignable...`** | `process.env` puede ser `undefined` en TS estricto. | Usar valores por defecto: `process.env.DB_PORT \|\| '5432'`. |
| **`EADDRINUSE: address already in use :::3001`** | Proceso Node.js zombie en segundo plano. | Usar `sudo fuser -k 3001/tcp` o cambiar el puerto en `main.ts`. |
| **`UnknownDependenciesException (JwtService)`** | `JwtModule` no estaba disponible globalmente. | Agregar `global: true` en `JwtModule.registerAsync()`. |
| **`Cannot read properties of undefined (reading 'get')`** | Falta inyectar `ConfigService` en el `useFactory`. | Agregar `inject: [ConfigService]` en la configuración asíncrona. |
| **`ERR_ADDRESS_UNREACHABLE` en el navegador** | Firewall de AlmaLinux bloqueando el puerto. | Abrir el puerto con `firewall-cmd` y verificar `app.enableCors()`. |
| **El menú no se actualiza tras insertar datos en BD** | Zustand tiene persistencia en `localStorage`. | Ejecutar `localStorage.clear()` en la consola del navegador. |
| **`'FormEvent' is deprecated` / `verbatimModuleSyntax`** | Reglas estrictas de TypeScript en Vite/React. | Usar `React.FormEvent<HTMLFormElement>` y `import type`. |

---

## 8. Próximos Pasos (Roadmap a Producción)

Para llevar este sistema a un entorno productivo (Go-Live), se deben completar las siguientes tareas:

1. **Integración LDAP Real:** Conectar el `LdapStrategy` al Active Directory corporativo real y mapear los atributos (`uid`, `mail`, `cn`).
2. **Servicio SMTP (Nodemailer):** Implementar el envío real del código OTP de 6 dígitos al correo corporativo del usuario.
3. **Build de Producción:**
   * Frontend: `npm run build` y servir la carpeta `dist` mediante Nginx.
   * Backend: `npm run build` y ejecutar `node dist/main.js` usando `PM2` para gestión de procesos.
4. **Nginx como Proxy Inverso:** Configurar Nginx para que escuche en el puerto 443 (HTTPS) y enrute `/api` al puerto 3001 y `/` a los archivos estáticos de React.
5. **Permisos Granulares en UI:** Consumir el objeto `permissions` del JSON para habilitar/deshabilitar botones (Crear, Editar, Borrar) en los formularios de React.

---

### 📝 Notas Finales
Este sistema representa una arquitectura moderna, escalable y altamente segura, alineada con los estándares de desarrollo de software empresarial actuales. Separa claramente las responsabilidades (Backend de lógica/seguridad, Frontend de presentación) y utiliza una base de datos relacional robusta para la toma de decisiones de negocio.