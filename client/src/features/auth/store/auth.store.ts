import { create } from 'zustand';
import { meRequest, refreshRequest } from '../api/auth.api';
import type { AuthUser } from '../types';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  initialized: boolean;
  bootstrapping: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  bootstrap: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  initialized: false,
  bootstrapping: false,

  setAuth(user, accessToken) {
    set({ user, accessToken, initialized: true });
  },

  setAccessToken(accessToken) {
    set({ accessToken });
  },

  clearAuth() {
    set({ user: null, accessToken: null, initialized: true, bootstrapping: false });
  },

  async bootstrap() {
    const state = get();
    if (state.initialized || state.bootstrapping) return;

    set({ bootstrapping: true });

    try {
      const refreshed = await refreshRequest();
      const me = await meRequest(refreshed.accessToken);
      set({
        user: me.user,
        accessToken: refreshed.accessToken,
        initialized: true,
        bootstrapping: false,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        initialized: true,
        bootstrapping: false,
      });
    }
  },
}));
