import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'abeseg', name: 'seg_log_autenticacion' })
export class LogAutenticacion {
  @PrimaryGeneratedColumn({ name: 'log_id' })
  logId: number;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @Column({ name: 'ip_origen', type: 'inet', nullable: true })
  ipOrigen: string;

  @Column({ name: 'metodo_login', length: 20, nullable: true })
  metodoLogin: string;

  @Column({ name: 'resultado', length: 20, nullable: true })
  resultado: string;

  @Column({ name: 'detalle_error', type: 'text', nullable: true })
  detalleError: string;

  // ✅ AGREGADO: Columnas requeridas por tu base de datos
  @Column({ name: 'usu_cre', length: 80, default: 'SYSTEM' })
  usuCre: string;

  @CreateDateColumn({ name: 'fec_cre', default: () => 'CURRENT_TIMESTAMP' })
  fecCre: Date;

  @CreateDateColumn({ name: 'fecha_evento', default: () => 'CURRENT_TIMESTAMP' })
  fechaEvento: Date;
}