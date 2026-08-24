import { useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, LockKeyhole } from 'lucide-react';
import type { MissionPublic } from '@bughunter/contracts';
import { Empty } from './ui/Empty.js';

type MissionDirectoryProps = {
  missions: MissionPublic[];
  onStart?: (id: string) => void;
};

export function MissionDirectory({ missions, onStart }: MissionDirectoryProps): ReactElement {
  const navigate = useNavigate();
  const handleStart = (id: string): void => {
    if (onStart) onStart(id);
    else navigate(`/missions/${id}`);
  };
  const [search, setSearch] = useState('');
  const [chapter, setChapter] = useState('all');
  const [bugType, setBugType] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState<'all' | 'available' | 'completed' | 'locked'>('all');

  const chapters = [...new Set(missions.map((mission) => mission.chapterOrder))];
  const bugTypes = [...new Set(missions.map((mission) => mission.bugType.name))];

  const filtered = useMemo(
    () =>
      missions.filter((mission) => {
        const matchesSearch = `${mission.title} ${mission.description} ${mission.bugType.name}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesChapter = chapter === 'all' || mission.chapterOrder === Number(chapter);
        const matchesBugType = bugType === 'all' || mission.bugType.name === bugType;
        const matchesDifficulty =
          difficulty === 'all' || mission.difficulty === Number(difficulty);
        const matchesStatus =
          status === 'all' ||
          (status === 'available' && !mission.isLocked && !mission.isCompleted) ||
          (status === 'completed' && mission.isCompleted) ||
          (status === 'locked' && mission.isLocked);
        return (
          matchesSearch && matchesChapter && matchesBugType && matchesDifficulty && matchesStatus
        );
      }),
    [missions, search, chapter, bugType, difficulty, status],
  );

  return (
    <section className="page">
      <h1 className="page-title">미션</h1>
      <div className="mission-filters">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="미션 검색…"
          aria-label="Mission 검색"
        />
        <select
          value={chapter}
          onChange={(event) => setChapter(event.target.value)}
          aria-label="Chapter 필터"
        >
          <option value="all">모든 챕터</option>
          {chapters.map((item) => (
            <option key={item} value={item}>
              CH.{item}
            </option>
          ))}
        </select>
        <select
          value={bugType}
          onChange={(event) => setBugType(event.target.value)}
          aria-label="Bug 유형 필터"
        >
          <option value="all">모든 버그</option>
          {bugTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          aria-label="난이도 필터"
        >
          <option value="all">모든 난이도</option>
          {[1, 2, 3, 4, 5].map((item) => (
            <option key={item} value={item}>
              {'★'.repeat(item)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          aria-label="진행 상태 필터"
        >
          <option value="all">모든 상태</option>
          <option value="available">시작 가능</option>
          <option value="completed">완료</option>
          <option value="locked">잠김</option>
        </select>
      </div>
      <p className="filter-summary">
        <strong>{filtered.length}</strong>개의 미션
      </p>
      <div className="mission-list">
        {filtered.map((mission) => (
          <button
            key={mission.id}
            className={mission.isLocked ? 'mission-card locked' : 'mission-card'}
            disabled={mission.isLocked}
            onClick={() => handleStart(mission.id)}
          >
            {mission.isLocked ? (
              <LockKeyhole size={15} />
            ) : mission.isCompleted ? (
              <Check size={15} />
            ) : (
              <span className="led ok" />
            )}
            <span className="mc-meta">
              <span className="mc-code">
                CH.{mission.chapterOrder}-M.{mission.order}
              </span>
              {mission.isBoss && <span className="mc-boss">보스 미션</span>}
            </span>
            <span className="mc-body">
              <span className="mc-title">{mission.title}</span>
              <span className="mc-desc">{mission.description}</span>
            </span>
            <span className="mc-side">
              <span className="tag">{mission.bugType.name}</span>
              <span className="mc-stars">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} className={index < mission.difficulty ? '' : 'star-off'}>
                    ★
                  </span>
                ))}
              </span>
              {mission.isCompleted ? (
                <span className="btn ghost">다시 풀기 <ChevronRight size={14} /></span>
              ) : (
                <span className="btn primary">시작 <ChevronRight size={14} /></span>
              )}
            </span>
          </button>
        ))}
      </div>
      {!filtered.length && <Empty text="현재 필터와 일치하는 미션이 없습니다." />}
    </section>
  );
}