import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, Check, LockKeyhole, Trophy } from 'lucide-react';
import type { MissionPublic } from '@bughunter/contracts';
import { Empty } from './ui/Empty.js';

type RoadmapProps = {
  missions: MissionPublic[];
  onStart?: (id: string) => void;
  compact?: boolean;
};

export function Roadmap({ missions, onStart, compact = false }: RoadmapProps): ReactElement {
  const navigate = useNavigate();
  const handleStart = (id: string): void => {
    if (onStart) onStart(id);
    else navigate(`/problems/${id}`);
  };
  const chapters = [...new Set(missions.map((mission) => mission.chapterOrder))];
  return (
    <section className={compact ? 'roadmap compact' : 'roadmap page'}>
      {!compact && (
        <h1 className="page-title">
          학습하기 <span className="page-title-path">· 학습 경로</span>
        </h1>
      )}
      {chapters.map((chapter) => {
        const items = missions.filter((mission) => mission.chapterOrder === chapter);
        const done = items.filter((mission) => mission.isCompleted).length;
        return (
          <article className="chapter-card" key={chapter}>
            <header className="cc-head">
              <span className="cc-id">CH.{chapter}</span>
              <span className="cc-title">{items[0]?.bugType.name ?? ''}</span>
              <span className="cc-count">
                {done}/{items.length} 완료
              </span>
            </header>
            <div className="mission-row">
              {items.map((mission) => {
                const stateClass = mission.isLocked
                  ? 'locked'
                  : mission.isCompleted
                    ? 'complete'
                    : 'open';
                return (
                  <button
                    key={mission.id}
                    className={`mission-node ${stateClass} ${mission.isBoss ? 'boss' : ''}`}
                    disabled={mission.isLocked}
                    onClick={() => handleStart(mission.id)}
                  >
                    {mission.isLocked ? (
                      <LockKeyhole />
                    ) : mission.isCompleted ? (
                      <Check />
                    ) : mission.isBoss ? (
                      <Trophy />
                    ) : (
                      <Bug />
                    )}
                    <span className="m-title">{mission.title}</span>
                    <span className="m-order">M.{mission.order}</span>
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
      {!missions.length && <Empty text="미션 목록을 불러오지 못했습니다." />}
    </section>
  );
}
