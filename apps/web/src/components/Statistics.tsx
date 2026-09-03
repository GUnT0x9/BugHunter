import { useEffect, useState, type ReactElement } from 'react';
import { CircleHelp, Send, Timer, Trophy } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';
import { Panel } from './ui/Panel.js';

export function Statistics(): ReactElement {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.statistics>> | null>(null);

  useEffect(() => {
    void api
      .statistics()
      .then(setStats)
      .catch(() => null);
  }, []);

  const maxFixed = Math.max(1, ...(stats?.bugSkills.map((skill) => skill.fixedCount) ?? [0]));

  return (
    <section className="page">
      <h1 className="page-title">통계</h1>
      <div className="stat-grid">
        <Panel title="해결한 미션">
          <div className="metric">
            <span className="m-label">
              <Trophy /> 해결한 미션
            </span>
            <span className="m-value green">{stats?.solvedCount ?? 0}</span>
            <span className="m-sub">완료한 미션 수</span>
          </div>
        </Panel>
        <Panel title="제출 횟수">
          <div className="metric">
            <span className="m-label">
              <Send /> 제출 횟수
            </span>
            <span className="m-value">{stats?.totalSubmissions ?? 0}</span>
            <span className="m-sub">채점 요청 수</span>
          </div>
        </Panel>
        <Panel title="평균 시도">
          <div className="metric">
            <span className="m-label">
              <CircleHelp /> 평균 시도
            </span>
            <span className="m-value">{stats?.averageAttempts ?? 0}</span>
            <span className="m-sub">미션당 제출 횟수</span>
          </div>
        </Panel>
        <Panel title="평균 실행 시간">
          <div className="metric">
            <span className="m-label">
              <Timer /> 평균 실행 시간
            </span>
            <span className="m-value">{stats?.executionTimeMs ?? 0}ms</span>
            <span className="m-sub">채점 실행 시간</span>
          </div>
        </Panel>
      </div>
      <Panel title="버그 유형별 해결">
        {stats && stats.bugSkills.length ? (
          <div className="skill-bars">
            {stats.bugSkills.map((skill) => (
              <div className="skill-bar" key={skill.name}>
                <div className="sb-label">
                  <span>{skill.name}</span>
                  <strong>{skill.fixedCount}개 해결</strong>
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${Math.round((skill.fixedCount / maxFixed) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="아직 해결한 버그 유형이 없습니다." />
        )}
      </Panel>
    </section>
  );
}