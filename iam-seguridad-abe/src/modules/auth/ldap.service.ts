import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRequire } from 'module';

// 1. Creamos un require nativo para módulos CommonJS dentro de ESM
const require = createRequire(import.meta.url);

// 2. Importamos la librería y le decimos a TypeScript que es 'any' para que no se queje de los tipos
const LdapAuth: any = require('ldapauth-fork');

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);
  private ldapClient: any;

  constructor(private configService: ConfigService) {
    // 3. Ahora sí, TypeScript no se quejará de 'url' ni de 'Options'
    // El filtro de búsqueda usa la plantilla {{username}} para que CUALQUIER
    // usuario registrado en LDAP pueda autenticarse, sin listas blancas fijas.
    this.ldapClient = new LdapAuth({
      url: this.configService.getOrThrow<string>('LDAP_URL'),
      bindDN: this.configService.getOrThrow<string>('LDAP_BIND_DN'),
      bindCredentials: this.configService.getOrThrow<string>('LDAP_BIND_PASSWORD'),
      searchBase: this.configService.getOrThrow<string>('LDAP_SEARCH_BASE'),
      searchFilter:
        this.configService.get<string>('LDAP_SEARCH_FILTER') || '(uid={{username}})',
      // Reconnecta automáticamente si la conexión LDAP cae en segundo plano.
      reconnectInterval: 300,
    });

    this.ldapClient.on('error', (err: any) => {
      this.logger.error(`⚠️ Error de conexión LDAP en segundo plano: ${err.message}`);
    });
  }

  /**
   * Normaliza el identificador recibido del cliente:
   * - Quita espacios.
   * - Si llega como correo (juan.perez@abe.bo), extrae el uid (juan.perez).
   */
  private normalizeUsername(input: string): string {
    const trimmed = (input || '').trim();
    const atIdx = trimmed.indexOf('@');
    return atIdx > 0 ? trimmed.slice(0, atIdx) : trimmed;
  }

  async validateUser(usernameInput: string, password: string): Promise<any> {
    const username = this.normalizeUsername(usernameInput);

    if (!username || !password) {
      throw new UnauthorizedException('Debe proporcionar usuario y contraseña');
    }

    return new Promise((resolve, reject) => {
      this.logger.log(`🔍 Intentando autenticar usuario LDAP: ${username}`);

      this.ldapClient.authenticate(username, password, (err: any, user: any) => {
        if (err) {
          // No filtramos si el fallo es "usuario no existe" o "mal password":
          // ambos se responden igual para no revelar qué cuentas existen.
          this.logger.warn(`❌ Falló la autenticación LDAP para "${username}": ${err.message}`);
          reject(new UnauthorizedException('Usuario o contraseña incorrectos'));
        } else if (!user) {
          this.logger.warn(`⚠️ Usuario no encontrado en LDAP: ${username}`);
          reject(new UnauthorizedException('Usuario o contraseña incorrectos'));
        } else {
          this.logger.log(`✅ Usuario autenticado correctamente en LDAP: ${username}`);
          resolve(user);
        }
      });
    });
  }
}