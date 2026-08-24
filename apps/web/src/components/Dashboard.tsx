import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, ChevronRight, Flame, Sparkles } from 'lucide-react';
import type { MissionPublic } from '@bughunter/contracts';
import { ProgressBar } from './ui/ProgressBar.js';
import { Panel } from './ui/Panel.js';
import { Roadmap } from './Roadmap.js';
import type { Progress } from './Shell.js';

type DashboardProps = {
  progress: Progress | null;
  missions: MissionPublic[];
  onStart?: (id: string) => void;
};

function Metric({
  label,
  value,
  tone = '',
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  tone?: 'green' | 'amber' | '';
  sub: string;
  icon: ReactElement;
}): ReactElement {
  return (
    <Panel title={label}>
      <div className="metric">
        <span className="m-label">
          {icon} {label}
        </span>
        <span className={`m-value ${tone}`}>{value}</span>
        <span className="m-sub">{sub}</span>
      </div>
    </Panel>
  );
}

export function Dashboard({ progress, missions, onStart }: DashboardProps): ReactElement {
  const navigate = useNavigate();
  const handleStart = (id: string): void => {
    if (onStart) onStart(id);
    else navigate(`/missions/${id}`);
  };
  const next =
    missions.find((mission) => !mission.isLocked && !mission.isCompleted) ??
    missions.find((mission) => !mission.isLocked);

  return (
    <section className="page">
      <h1 className="page-title">대시보드</h1>

      <Panel title="이어 학습하기">
        <div className="resume-panel">
          <div>
            <span className="resume-id">
              CH.{next?.chapterOrder ?? 1}-M.{next?.order ?? 1}
              {next?.isBoss ? ' · 보스 미션' : ''}
            </span>
            <h2>{next?.title ?? '학습 가능한 Mission이 없습니다'}</h2>
            <p className="resume-desc">
              {next
                ? `${next.bugType.name} · 난이도 ${'★'.repeat(next.difficulty)}`
                : '모든 Mission을 완료했습니다.'}
            </p>
          </div>
          <button
            className="btn primary"
            disabled={!next}
            onClick={() => next && handleStart(next.id)}
          >
            계속 학습하기 <ChevronRight size={15} />
          </button>
        </div>
      </Panel>

      <div className="metric-grid">
        <Metric
          label="고친 버그"
          value={progress?.bugsFixed ?? 0}
          tone="green"
          sub="완료한 미션 수"
          icon={<Bug />}
        />
        <Metric
          label="연속 학습"
          value={`${progress?.streak ?? 0}일`}
          tone="amber"
          sub="매일 꾸준히"
          icon={<Flame />}
        />
        <Metric
          label="총 XP"
          value={progress?.totalXp ?? 0}
          sub={`LV.${progress?.level ?? 1}`}
          icon={<Sparkles />}
        />
      </div>

      <h2 className="section-heading">학습 경로</h2>
      <Roadmap missions={missions.slice(0, 8)} onStart={handleStart} compact />
      {progress && (
        <div className="dashboard-xp">
          <ProgressBar
            value={progress.xpIntoLevel}
            max={progress.xpForNextLevel}
            readout={`LV.${progress.level} → LV.${progress.level + 1} · 남은 XP ${progress.xpForNextLevel - progress.xpIntoLevel}`}
          />
        </div>
      )}
    </section>
  );
}