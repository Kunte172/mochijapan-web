import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/">
          MochiJapan
        </NavLink>
        <nav className="nav-list">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/learn">Học</NavLink>
          <span>Ôn tập</span>
          <span>Sổ tay</span>
          <span>Từ điển</span>
          <span>AI Tutor</span>
          <span>Thống kê</span>
        </nav>
      </aside>
      <main className="page-content">{children}</main>
    </div>
  );
}
