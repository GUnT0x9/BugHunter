import type { ReactElement, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bug,
  BookOpen,
  ChartNoAxesColumn,
  Code2,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react';
import type { User } from '@bughunter/contracts';

import { api } from '../lib/api.js';

export type Progress = Awaited<ReturnType<typeof api.progress>>;

const NAV: Array<{ to: string; label: string; icon: ReactElement }> = [
  { to: '/', label: '대시보드', icon: <LayoutDashboard size={15} /> },
  { to: '/roadmap', label: '로드맵', icon: <BookOpen size={15} /> },
  { to: '/missions', label: '미션', icon: <Code2 size={15} /> },
  { to: '/bugdex', label: '버그 도감', icon: <Bug size={15} /> },
  { to: '/statistics', label: '통계', icon: <ChartNoAxesColumn size={15} /> },
  { to: '/profile', label: '프로필', icon: <UserRound size={15} /> },
];

type ShellProps = {
  user: User;
  progress: Progress | null;
  onLogout: () => void;
  children: ReactNode;
};

export function Shell({ user, progress, onLogout, children }: ShellProps): ReactElement {
  return (
    <div className="app-top-layout">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="topbar-brand">
            <Bug size={16} /> BugHunter
          </NavLink>

          <nav className="topnav" aria-label="주요 내비게이션">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'topnav-item active' : 'topnav-item')}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-right">
            <span className="topbar-meta">
              <span className="topbar-user">
                {user.username} · LV.{progress?.level ?? 1}
              </span>
              <span className="topbar-xp">
                XP <strong>{progress?.totalXp ?? 0}</strong> · {progress?.bugsFixed ?? 0}개 해결
              </span>
            </span>
            <button className="topbar-logout" onClick={onLogout} aria-label="로그아웃">
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="content-area content-centered">{children}</main>
    </div>
  );
}
