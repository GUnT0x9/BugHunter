import type { ReactElement, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bug,
  Code2,
  Home,
  LogOut,
  Settings2,
  UserRound,
  Search,
  Medal,
  ListChecks,
  Trophy,
  Swords,
  ScrollText,
  Users,
} from 'lucide-react';
import type { User } from '@bughunter/contracts';

import { api } from '../lib/api.js';

export type Progress = Awaited<ReturnType<typeof api.progress>>;

type NavigationItem = { to: string; label: string; icon: ReactElement; iconOnly?: boolean };

const LEARNING_NAV: NavigationItem[] = [
  { to: '/', label: '홈', icon: <Home size={15} /> },
  { to: '/problems', label: '문제 풀기', icon: <Code2 size={15} /> },
  { to: '/bugdex', label: '버그 도감', icon: <Bug size={15} /> },
  { to: '/rankings', label: '랭킹', icon: <Trophy size={15} /> },
  { to: '/challenges', label: '챌린지', icon: <Swords size={15} /> },
  { to: '/achievements', label: '업적', icon: <Medal size={15} /> },
  { to: '/quests', label: '퀘스트', icon: <ListChecks size={15} /> },
];

type ShellProps = {
  user: User;
  progress: Progress | null;
  onLogout: () => void;
  children: ReactNode;
};

export function Shell({ user, progress, onLogout, children }: ShellProps): ReactElement {
  const navigation: NavigationItem[] =
    user.role === 'ADMIN'
      ? [
          ...LEARNING_NAV,
          { to: '/admin/missions', label: '문제 관리', icon: <Settings2 size={15} /> },
          { to: '/admin/submissions', label: '제출 로그', icon: <ScrollText size={15} /> },
          { to: '/admin/users', label: '사용자', icon: <Users size={15} /> },
        ]
      : LEARNING_NAV;
  return (
    <div className="app-top-layout">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="topbar-brand">
            <img src="/debugrove-icon.png" alt="" /> Debugrove
          </NavLink>

          <nav className="topnav" aria-label="주요 내비게이션">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `${isActive ? 'topnav-item active' : 'topnav-item'}${item.iconOnly ? ' icon-only' : ''}`
                }
                aria-label={item.label}
                title={item.label}
              >
                {item.icon}
                {!item.iconOnly && item.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-right">
            <NavLink
              to="/search"
              className={({ isActive }) => (isActive ? 'topbar-search active' : 'topbar-search')}
              aria-label="사용자 검색"
              title="사용자 검색"
            >
              <Search size={16} />
            </NavLink>
            <NavLink to="/my" className="topbar-account">
              <UserRound size={15} />
              <span>{user.role === 'ADMIN' ? 'ADMIN' : '내 학습'}</span>
              <small>LV.{progress?.level ?? 1}</small>
            </NavLink>
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
