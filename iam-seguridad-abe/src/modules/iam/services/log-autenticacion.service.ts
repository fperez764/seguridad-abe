import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogAutenticacion } from '../entities/log-autenticacion.entity.js';

@Injectable()
export class LogAutenticacionService {
  constructor(
    @InjectRepository(LogAutenticacion)
    private readonly logRepository: Repository<LogAutenticacion>,
  ) {}

  async registrarLog(log: Partial<LogAutenticacion>): Promise<void> {
    try {
      //  FORZAMOS los valores para garantizar que NUNCA sean null
      const logData = {
        ...log,
        usuCre: log.usuCre || 'SYSTEM',
        fecCre: log.fecCre || new Date(), // <-- Enviamos la fecha explícitamente desde JS
      };
      
      const nuevoLog = this.logRepository.create(logData);
      await this.logRepository.save(nuevoLog);
    } catch (error: any) {
      // Si falla el log, lo registramos en consola pero NO rompemos el flujo de autenticación del usuario
      console.error(' Error al registrar log de autenticación:', error.message);
    }
  }
}