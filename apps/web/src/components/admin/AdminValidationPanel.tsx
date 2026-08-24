import type { ReactElement } from 'react';
import {
  Check,
  ChevronUp,
  Circle,
  Eye,
  LoaderCircle,
  LockKeyhole,
  Play,
  Save,
  ServerCog,
  X,
} from 'lucide-react';
import type {
  AdminMission,
  AdminMissionDraft,
  AdminValidationReport,
} from '../../lib/admin-types.js';

type AdminValidationPanelProps = {
  mission: AdminMission;
  draft: AdminMissionDraft;
  report: AdminValidationReport | null;
  dirty: boolean;
  busyAction: string | null;
  onValidate: () => void;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function AdminValidationPanel({
  mission,
  draft,
  report,
  dirty,
  busyAction,
  onValidate,
  onSave,
  onPreview,
  onPublish,
  onUnpublish,
}: AdminValidationPanelProps): ReactElement {
  const checks = getShapeChecks(draft);
  const busy = busyAction !== null;
  const passedCount = checks.filter((check) => check.passed).length;
  const canPublish = report?.ready === true && !dirty && !busy;

  return (
    <aside className="admin-validation-panel" aria-label="미션 검증 패널">
      <header className="admin-validation-heading">
        <div>
          <span className="admin-eyebrow">VALIDATION</span>
          <h2>검증 패널</h2>
        </div>
        <ChevronUp size={16} />
      </header>

      <section className="admin-validation-section">
        <div className="admin-validation-title">
          <strong>형식 검사</strong>
          <span>
            {passedCount} / {checks.length} 통과
          </span>
        </div>
        <div className="admin-check-list">
          {checks.map((check) => (
            <div className={check.passed ? 'passed' : 'failed'} key={check.label}>
              {check.passed ? <Check size={14} /> : <X size={14} />}
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-validation-section">
        <div className="admin-validation-title">
          <strong>Docker 채점</strong>
          <ValidationVerdict report={report} />
        </div>
        <div className="admin-docker-summary">
          <ServerCog size={18} />
          <div>
            <strong>Python 3.12 격리 환경</strong>
            <span>
              테스트 {draft.tests.length}개 · 숨김{' '}
              {draft.tests.filter((test) => test.isHidden).length}개
            </span>
          </div>
        </div>
        {report ? (
          report.ready ? (
            <>
              <div className="admin-validation-test-results" aria-label="Docker 테스트 결과">
                {draft.tests.map((test, index) => {
                  const input = test.input.trim().replace(/\s+/g, ' ').slice(0, 18) || '∅';
                  const expected =
                    test.expectedOutput.trim().replace(/\s+/g, ' ').slice(0, 18) || '∅';
                  return (
                    <div key={`${index}-${test.isHidden}`}>
                      <Check size={13} />
                      <strong>테스트 {index + 1}</strong>
                      <span title={test.input}>입력: {input}</span>
                      <span title={test.expectedOutput}>예상: {expected}</span>
                      <b>통과</b>
                    </div>
                  );
                })}
              </div>
              <div className="admin-validation-success" role="status">
                <Check size={15} /> 정답 코드와 초기 코드 검증을 모두 통과했습니다.
              </div>
            </>
          ) : (
            <div className="admin-validation-issues" role="alert">
              <strong>검증에서 확인된 문제</strong>
              <ul>
                {report.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <div className="admin-validation-pending">
            <Circle size={13} /> 저장 후 검증을 실행해주세요.
          </div>
        )}
      </section>

      <section className="admin-runtime-meta">
        <span>실행 환경</span>
        <strong>Python 3.12 · Docker</strong>
        <span>공개 상태</span>
        <strong className={mission.isPublished ? 'published' : ''}>
          {mission.isPublished ? '공개' : '비공개'}
        </strong>
      </section>

      <div className="admin-validation-actions">
        <button className="admin-primary-action" disabled={busy} onClick={onValidate}>
          {busyAction === 'validate' ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <Play size={16} />
          )}
          {dirty ? '저장 후 검증 실행' : '검증 실행'}
        </button>
        <div className="admin-secondary-actions">
          <button disabled={busy} onClick={onPreview}>
            <Eye size={15} /> 미리보기
          </button>
          <button disabled={!dirty || busy} onClick={onSave}>
            {busyAction === 'save' ? (
              <LoaderCircle className="spin" size={15} />
            ) : (
              <Save size={15} />
            )}
            임시 저장
          </button>
        </div>
        {mission.isPublished ? (
          <button
            className="admin-publish-action published"
            disabled={dirty || busy}
            onClick={onUnpublish}
          >
            <Check size={15} /> 공개 중 · 비공개 전환
          </button>
        ) : (
          <button className="admin-publish-action" disabled={!canPublish} onClick={onPublish}>
            <LockKeyhole size={15} /> 발행하기
          </button>
        )}
        {!mission.isPublished && !canPublish && (
          <p className="admin-publish-help">모든 검증을 통과해야 발행할 수 있습니다.</p>
        )}
      </div>
    </aside>
  );
}

function ValidationVerdict({ report }: { report: AdminValidationReport | null }): ReactElement {
  if (!report) return <span className="pending">실행 전</span>;
  return (
    <span className={report.ready ? 'passed' : 'failed'}>{report.ready ? '통과' : '실패'}</span>
  );
}

function getShapeChecks(draft: AdminMissionDraft): Array<{ label: string; passed: boolean }> {
  return [
    { label: '초기 코드가 입력됨', passed: draft.initialCode.trim().length > 0 },
    {
      label: '정답 코드가 초기 코드와 다름',
      passed:
        draft.referenceSolution.trim().length > 0 &&
        draft.referenceSolution.trim() !== draft.initialCode.trim(),
    },
    { label: 'Test Case가 3개 이상', passed: draft.tests.length >= 3 },
    { label: '마지막 테스트가 숨김 처리됨', passed: draft.tests.at(-1)?.isHidden === true },
    {
      label: '단계별 힌트 3개가 입력됨',
      passed: draft.hints.length === 3 && draft.hints.every((hint) => hint.trim().length > 0),
    },
    {
      label: '관련 개념이 연결됨',
      passed: draft.concepts.some((concept) => concept.trim().length > 0),
    },
  ];
}
