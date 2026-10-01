import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../iam/entities/usuario.entity.js'; // ✅ Con .js

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async getDynamicMenu(usuarioId: number) {
    const query = `
      SELECT 
        m.codigo_modulo AS code,
        m.nombre_modulo AS name,
        m.icon AS icon,
        m.ruta_ui AS routePath,
        m.base_url AS baseUrl,
        p.permisos AS permissions
      FROM abeseg.seg_modulo m
      INNER JOIN abeseg.seg_rol_modulo_permiso p ON m.modulo_id = p.modulo_id
      INNER JOIN abeseg.seg_asignacion_acceso a ON p.rol_id = a.rol_id
      WHERE a.usuario_id = $1 AND a.activo = true;
    `;
    
    const results: any[] = await this.usuarioRepo.query(query, [usuarioId]);

    return results.map((item: any) => {
      const isExternal = !!item.baseurl && item.baseurl.trim() !== '';
      const fullUrl = isExternal ? `${item.baseurl}${item.routepath}` : item.routepath;

      return {
        code: item.code,
        name: item.name,
        icon: item.icon,
        url: fullUrl,
        isExternal: isExternal,
        permissions: item.permissions
      };
    });
  }
}