import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Usuario } from '../entities/usuario.entity.js';

@Injectable()
export class UsuarioService {
  private readonly logger = new Logger(UsuarioService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Busca un usuario por su LDAP UID (comparación insensible a mayúsculas).
   * Si no existe en la BD local, lo crea automáticamente (JIT provisioning),
   * de modo que CUALQUIER usuario válido registrado en LDAP pueda ingresar.
   */
  async findOrCreateByLdap(ldapData: { ldapUid: string; email: string; nombreCompleto: string }): Promise<Usuario> {
    const uid = ldapData.ldapUid.trim().toLowerCase();

    // 1. Intentar buscar el usuario en abeseg.seg_usuario (case-insensitive)
    let usuario = await this.usuarioRepository.findOne({
      where: { ldapUid: ILike(uid) },
    });

    if (usuario) {
      //  El usuario ya existe: actualizar fecha y usuario de modificación
      usuario.emailCorporativo = ldapData.email;
      usuario.nombreCompleto = ldapData.nombreCompleto;
      usuario.usuMod = uid; // O 'SYSTEM' si prefieres
      usuario.fecMod = new Date();
      await this.usuarioRepository.save(usuario);
    } else {
      //  El usuario no existe: crearlo
      usuario = this.usuarioRepository.create({
        ldapUid: uid,
        emailCorporativo: ldapData.email,
        nombreCompleto: ldapData.nombreCompleto,
        estadoUsuario: 'ACTIVO',
        usuCre: uid,
        fecCre: new Date(),
        usuMod: uid,
        fecMod: new Date(),
      });

    // Guardar en PostgreSQL (schema abeseg)
    usuario = await this.usuarioRepository.save(usuario);
    }
    
    // TODO: Aquí podrías asignar un rol/área/ámbito por defecto en seg_asignacion_acceso si fuera necesario
  
    return usuario;
  }

  /**
   * Busca un usuario por su ID (usado en el flujo de validación de OTP)
   */
  async findById(usuarioId: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { usuarioId } });
  }


  /**
   * Actualiza el último intento de 2FA (Útil para auditoría en seg_log_autenticacion)
   */
  /*async updateLast2FAValidation(usuarioId: number): Promise<void> {
    await this.usuarioRepository.update(usuarioId, {
      ultimo2faValidacion: new Date(),
      usuMod: 'SYSTEM_2FA',
      fecMod: new Date()
    });
  }*/
}