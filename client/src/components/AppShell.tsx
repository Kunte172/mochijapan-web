import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutRequest } from '../features/auth/api/auth.api';
import { useAuthStore } from '../features/auth/store/auth.store';

type Props = { children: ReactNode };

export function AppShell({ children }: Props) {
  const navigate = useNavigate();
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  async function handleLogout() {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/">MochiJapan</NavLink>
        <nav className="nav-list">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/learn">Học</NavLink>
          <NavLink to="/review">Ôn tập</NavLink>
          <NavLink to="/notebook">Sổ tay</NavLink>
          <NavLink to="/dictionary">Từ điển</NavLink>
          <span>AI Tutor</span>
          <NavLink to="/analytics">Thống kê</NavLink>
        </nav>
        <div className="auth-sidebar">
          {!initialized ? (
            <span>Đang kiểm tra phiên...</span>
          ) : user ? (
            <>
              <strong>{user.displayName ?? user.email}</strong>
              <small>{user.email}</small>
              {!user.emailVerified && (
                <small className="verification-warning">Email chưa xác thực</small>
              )}
              <button className="sidebar-button" type="button" onClick={() => void handleLogout()}>
                Đăng xuất
              </button>
            </>
          ) : (
            <NavLink to="/login">Đăng nhập</NavLink>
          )}
        </div>
      </aside>
      <main className="page-content">{children}</main>
    </div>
  );
}
