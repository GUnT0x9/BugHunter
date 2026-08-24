import { useEffect, type ReactElement } from 'react';
import { Bug, X } from 'lucide-react';
import type { AdminMission, AdminMissionDraft } from '../../lib/admin-types.js';

type AdminPreviewDialogProps = {
  mission: AdminMission;
  draft: AdminMissionDraft;
  onClose: () => void;
};

export function AdminPreviewDialog({
  mission,
  draft,
  onClose,
}: AdminPreviewDialogProps): ReactElement {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="admin-preview-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="admin-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span>
            <Bug size={15} /> 학습자 미리보기
          </span>
          <button aria-label="미리보기 닫기" onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="admin-preview-body">
          <div className="admin-preview-meta">
            CH.{mission.chapter.sortOrder}-M.{draft.sortOrder} · {mission.bugType.name}
          </div>
          <h2 id="admin-preview-title">{draft.title}</h2>
          <p>{draft.description}</p>
          <div className="admin-preview-tags">
            <span>난이도 {'★'.repeat(draft.difficulty)}</span>
            <span>{draft.baseXp} XP</span>
            {draft.isBoss && <span>보스 미션</span>}
          </div>
          <h3>제공 코드</h3>
          <pre>{draft.initialCode}</pre>
          <div className="admin-preview-footer">
            공개 테스트 {draft.tests.filter((test) => !test.isHidden).length}개 · 숨김 테스트{' '}
            {draft.tests.filter((test) => test.isHidden).length}개
          </div>
        </div>
      </section>
    </div>
  );
}
