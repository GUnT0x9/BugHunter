import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Clock3, Flame, Target, TrendingUp } from 'lucide-react';
import type { MissionPublic } from '@bughunter/contracts';
import type { Progress } from './Shell.js';

type DashboardProps = {
  progress: Progress | null;
  missions: MissionPublic[];
  onStart?: (id: string) => void;
};

export function Dashboard({ progress, missions, onStart }: DashboardProps): ReactElement {
  const navigate = useNavigate();
  const handleStart = (id: string): void => {
    if (onStart) onStart(id);
    else navigate(`/problems/${id}`);
  };
  const next =
    missions.find((mission) => !mission.isLocked && !mission.isCompleted) ??
    missions.find((mission) => !mission.isLocked);
  const recommendations = missions.filter((mission) => !mission.isLocked).slice(0, 3);
  const progressMax = Math.max(1, (progress?.bugsFixed ?? 0) + 5);
  const progressPercent = Math.min(100, Math.round(((progress?.bugsFixed ?? 0) / progressMax) * 100));
  const estimatedMinutes = next
    ? Math.max(5, next.difficulty * 4 + (next.isBoss ? 5 : 0))
    : 0;

  return (
    <section className="page dashboard-page">
      <h1 className="dashboard-heading">이어서 풀기</h1>

      <section className="dashboard-resume" aria-labelledby="resume-title">
        <div className="resume-panel">
          <div>
            <span className="resume-id">
              CH.{String(next?.chapterOrder ?? 1).padStart(2, '0')} → M.{String(next?.order ?? 1).padStart(2, '0')}
              {next?.isBoss ? ' · 보스 미션' : ''}
            </span>
            <h2 id="resume-title">{next?.title ?? '학습 가능한 문제가 없습니다'}</h2>
            <p className="resume-desc">
              {next
                ? `${next.bugType.name} · 약 ${estimatedMinutes}분`
                : '모든 문제를 완료했습니다.'}
            </p>
          </div>
          <button
            className="btn primary"
            disabled={!next}
            onClick={() => next && handleStart(next.id)}
          >
            계속 풀기 <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <h2 className="section-heading">학습 현황</h2>
      <div className="weekly-summary">
        <div className="weekly-progress" aria-label={`주간 진도율 ${progressPercent}%`}>
          <strong>{progressPercent}%</strong>
          <span>주간 진도율</span>
        </div>
        <div className="weekly-stat"><TrendingUp /><span>획득 XP<strong>{progress?.totalXp ?? 0}</strong></span></div>
        <div className="weekly-stat"><Target /><span>완료한 문제<strong>{progress?.bugsFixed ?? 0}개</strong></span></div>
        <div className="weekly-stat"><Flame /><span>연속 학습<strong>{progress?.streak ?? 0}일</strong></span></div>
      </div>

      <div className="section-title-row">
        <h2 className="section-heading">추천 문제</h2>
        <button className="text-link" onClick={() => navigate('/problems')}>전체 보기 <ArrowRight size={14} /></button>
      </div>
      <div className="recommendation-table">
        <div className="recommendation-head" aria-hidden="true">
          <span>상태</span><span>번호</span><span>문제</span><span>버그 유형</span><span>난이도</span><span />
        </div>
        {recommendations.map((mission, index) => (
          <button className="recommendation-row" key={mission.id} onClick={() => handleStart(mission.id)}>
            <span className="recommendation-status">{mission.isCompleted ? <Check /> : index === 0 ? <ArrowRight /> : <Clock3 />}</span>
            <span className="recommendation-code">#{String(mission.chapterOrder * 100 + mission.order).padStart(4, '0')}</span>
            <span className="recommendation-title">{mission.title}</span>
            <span className="recommendation-type">{mission.bugType.name}</span>
            <span className="recommendation-stars" aria-label={`난이도 ${mission.difficulty}점`}>
              {'★'.repeat(mission.difficulty)}<i>{'★'.repeat(5 - mission.difficulty)}</i>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </section>
  );
}
