export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: 'STUDENT' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
};

export type AuthResponse = {
  status: 'ok';
  user: AuthUser;
  accessToken: string;
};

export type RefreshResponse = {
  status: 'ok';
  accessToken: string;
};

export type MeResponse = {
  status: 'ok';
  user: AuthUser;
};
