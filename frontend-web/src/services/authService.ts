import axios from 'axios';

// Asegúrate de que esta IP y puerto coincidan con tu backend NestJS
const API_BASE_URL = 'http://192.168.238.60:3001'; 

export interface LoginStep1Response {
  requires2FA: boolean;
  tempToken: string;
}

export interface LoginStep2Response {
  access_token: string;
  user: {
    usuarioId: number;
    ldapUid: string;
    email?: string;
  };
}

export const authService = {
  // Paso 1: Validar LDAP
  loginStep1: async (ldapUid: string, password: string): Promise<LoginStep1Response> => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { ldapUid, password });
    return response.data;
  },

  // Paso 2: Validar OTP
  loginStep2: async (tempToken: string, otp: string): Promise<LoginStep2Response> => {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { tempToken, otp });
    return response.data;
  },
};