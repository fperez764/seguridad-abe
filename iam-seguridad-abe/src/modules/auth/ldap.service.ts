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
    this.ldapClient = new LdapAuth({
      url: this.configService.getOrThrow<string>('LDAP_URL'),
      bindDN: this.configService.getOrThrow<string>('LDAP_BIND_DN'),
      bindCredentials: this.configService.getOrThrow<string>('LDAP_BIND_PASSWORD'),
      searchBase: this.configService.getOrThrow<string>('LDAP_SEARCH_BASE'),
      searchFilter: this.configService.getOrThrow<string>('LDAP_SEARCH_FILTER'),
    });

    this.ldapClient.on('error', (err: any) => {
      this.logger.error(`⚠️ Error de conexión LDAP en segundo plano: ${err.message}`);
    });
  }

  async validateUser(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(`🔍 Intentando autenticar usuario LDAP: ${username}`);

      this.ldapClient.authenticate(username, password, (err: any, user: any) => {
        if (err) {
          this.logger.error(`❌ Error de validación LDAP: ${err.message}`);
          reject(new UnauthorizedException('Error al conectar con el servidor LDAP o credenciales inválidas'));
        } else if (!user) {
          this.logger.warn(`⚠️ Credenciales inválidas para el usuario: ${username}`);
          reject(new UnauthorizedException('Usuario o contraseña incorrectos'));
        } else {
          this.logger.log(`✅ Usuario autenticado correctamente en LDAP: ${username}`);
          resolve(user);
        }
      });
    });
  }
}