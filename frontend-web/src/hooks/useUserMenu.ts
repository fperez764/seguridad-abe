import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore, type MenuItem } from '../store/authStore.js';

const API_BASE_URL = 'http://192.168.238.60:3001'; // Tu backend NestJS

export const useUserMenu = () => {
  const token = useAuthStore((state) => state.token);
  const usuarioId = useAuthStore((state) => state.user?.usuarioId);

  return useQuery<MenuItem[]>({
    queryKey: ['userMenu', usuarioId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/iam/users/${usuarioId}/menu`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data;
    },
    enabled: !!token && !!usuarioId, // Solo se ejecuta si hay token y usuario
    staleTime: 5 * 60 * 1000, // El menú se considera "fresco" por 5 minutos
  });
};