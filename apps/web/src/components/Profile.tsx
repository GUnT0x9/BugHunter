import type { ReactElement } from 'react';
import { Flame, Trophy, UserRound } from 'lucide-react';
import type { User } from '@bughunter/contracts';
import { ProgressBar } from './ui/ProgressBar.js';
import { Panel } from './ui/Panel.js';
import type { Progress } from './Shell.js';

type ProfileProps = {
  user: User;
  progress: Progress | null;
};

export function Profile({ user, progress }: ProfileProps): ReactElement {
  return (
    <section className="page">
      <h1 className="page-title">프로필</h1>
      <Panel title="사용자 정보">
        <div className="profile-card">
          <div className="profile-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="profile-body">
            <h2>{user.username}</h2>
            <p className="p-role">
              LV.{progress?.level ?? 1} · {user.role === 'ADMIN' ? '관리자' : '일반 사용자'}
            </p>
            <ProgressBar
              value={progress?.xpIntoLevel ?? 0}
              max={progress?.xpForNextLevel ?? 1000}
              readout={`${progress?.xpIntoLevel ?? 0} / ${progress?.xpForNextLevel ?? 1000} XP`}
            />
            <div className="profile-meta">
              <span>
                <Trophy /> <strong>{progress?.totalXp ?? 0}</strong> 총 XP
              </span>
              <span>
                <UserRound /> <strong>{progress?.bugsFixed ?? 0}</strong> 고친 버그
              </span>
              <span>
                <Flame /> <strong>{progress?.streak ?? 0}일</strong> 연속 학습
              </span>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}