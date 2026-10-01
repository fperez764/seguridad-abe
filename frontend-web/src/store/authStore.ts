import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenuItem {
  code: string;
  name: string;
  icon: string;
  url: string;
  isExternal: boolean;
  permissions: {
    ver?: boolean;
    crear?: boolean;
    editar?: boolean;
    borrar?: boolean;
  };
}

interface AuthState {
  token: string | null;
  user: {
    usuarioId: number;
    ldapUid: string;
    email?: string;
  } | null;
  menu: MenuItem[];
  setToken: (token: string) => void;
  setUser: (user: { usuarioId: number; ldapUid: string; email?: string }) => void;
  setMenu: (menu: MenuItem[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      menu: [],
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setMenu: (menu) => set({ menu }),
      logout: () => set({ token: null, user: null, menu: [] }),
    }),
    {
      name: 'auth-storage', // Nombre en localStorage
    }
  )
);