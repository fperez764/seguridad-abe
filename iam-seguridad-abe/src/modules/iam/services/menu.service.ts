import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity.js';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Usuario) // O tu repositorio de SQL puro / QueryBuilder
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async getDynamicMenu(usuarioId: number) {
    // Usamos QueryBuilder para armar el JOIN exacto con tu esquema abeseg
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
      WHERE a.usuario_id = $1 
        AND a.activo = true;
    `;
    
    // Ejecutar query (asumiendo uso de pg Pool o TypeORM .query())
    const results = await this.usuarioRepo.query(query, [usuarioId]);

    // Transformamos la respuesta para el Frontend (React)
    return results.map((item: any) => {
      // Si base_url tiene valor, es un sistema externo (ej. https://clientes.abe.bo)
      const isExternal = !!item.base_url && item.base_url.trim() !== '';
      const fullUrl = isExternal ? `${item.baseUrl}${item.routePath}` : item.routePath;

      return {
        code: item.code,
        name: item.name,
        icon: item.icon,
        url: fullUrl,
        isExternal: isExternal,
        permissions: item.permissions // El JSONB {"ver": true, "crear": true...}
      };
    });
  }
}