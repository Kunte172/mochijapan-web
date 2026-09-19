import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

type Props = { children: ReactNode };

export function ProtectedRoute({ children }: Props) {
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!initialized) return <p>Đang kiểm tra phiên đăng nhập...</p>;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname, search: location.search } }}
      />
    );
  }

  return children;
}
