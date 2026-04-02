import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const STORAGE_KEY = 'evacu3d_auth';

const loadFromStorage = (): { token: string; user: AuthUser } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saved = loadFromStorage();

export const useAuthStore = create<AuthState>(() => ({
  token: saved?.token ?? null,
  user: saved?.user ?? null,
  isAuthenticated: !!saved?.token,

  login: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    useAuthStore.setState({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  },
}));
