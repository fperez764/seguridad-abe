import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'seg_usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'ldap_uid', unique: true, length: 100 })
  ldapUid: string;

  @Column({ name: 'email_corporativo', length: 255 })
  emailCorporativo: string;

  @Column({ name: 'nombre_completo', length: 255 })
  nombreCompleto: string;

  @Column({ name: 'estado_usuario', length: 20, default: 'ACTIVO' })
  estadoUsuario: string;

  @Column({ name: 'metodo_2fa', length: 20, nullable: true })
  metodo2fa: string;

  // Auditoría
  @Column({ name: 'usu_cre', length: 80 })
  usuCre: string;
  
  @Column({ name: 'fec_cre', type: 'timestamp' })
  fecCre: Date;

  @Column({ name: 'usu_mod', length: 80 })
  usuMod: string;
  
  @Column({ name: 'fec_mod', type: 'timestamp' })
  fecMod: Date;
}