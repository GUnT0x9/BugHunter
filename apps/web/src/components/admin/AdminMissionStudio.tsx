import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, MoreVertical } from 'lucide-react';
import { api } from '../../lib/api.js';
import {
  createAdminMissionDraft,
  normalizeAdminMissionDraft,
  type AdminMission,
  type AdminMissionDraft,
  type AdminValidationReport,
} from '../../lib/admin-types.js';
import { AdminMissionEditor, type AdminStudioTab } from './AdminMissionEditor.js';
import { AdminMissionSidebar } from './AdminMissionSidebar.js';
import { AdminPreviewDialog } from './AdminPreviewDialog.js';
import { AdminValidationPanel } from './AdminValidationPanel.js';

const TAB_LABELS: Array<{ id: AdminStudioTab; label: string }> = [
  { id: 'details', label: '기본 정보' },
  { id: 'code', label: '코드' },
  { id: 'tests', label: '테스트' },
  { id: 'guidance', label: '힌트 · 개념' },
];

export function AdminMissionStudio(): ReactElement {
  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminMissionDraft | null>(null);
  const [tab, setTab] = useState<AdminStudioTab>('code');
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<AdminValidationReport | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>('load');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const selected = useMemo(
    () => missions.find((mission) => mission.id === selectedId) ?? null,
    [missions, selectedId],
  );
  const selectedIndex = selected ? missions.findIndex((mission) => mission.id === selected.id) : -1;
  const dirty = Boolean(
    selected &&
    draft &&
    JSON.stringify(draft) !== JSON.stringify(createAdminMissionDraft(selected)),
  );

  useEffect(() => {
    void loadMissions();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft(createAdminMissionDraft(selected));
    setReport(null);
    setError('');
    setNotice('');
  }, [selectedId]);

  async function loadMissions(preferredId?: string): Promise<AdminMission[]> {
    setBusyAction('load');
    setError('');
    try {
      const next = await api.adminMissions();
      setMissions(next);
      setSelectedId((current) => preferredId ?? current ?? next[0]?.id ?? null);
      return next;
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
      return [];
    } finally {
      setBusyAction(null);
    }
  }

  const updateDraft = (next: AdminMissionDraft): void => {
    setDraft(next);
    setReport(null);
    setNotice('');
  };

  const selectMission = (id: string): void => {
    if (id === selectedId) return;
    if (dirty && !window.confirm('저장하지 않은 변경을 버리고 다른 미션으로 이동할까요?')) return;
    setSelectedId(id);
    setTab('code');
  };

  const moveSelection = (direction: -1 | 1): void => {
    const mission = missions[selectedIndex + direction];
    if (mission) selectMission(mission.id);
  };

  async function saveCurrent(): Promise<boolean> {
    if (!selected || !draft) return false;
    const input = normalizeAdminMissionDraft(draft);
    setBusyAction('save');
    setError('');
    try {
      await api.updateAdminMission(selected.id, input);
      const next = await api.adminMissions();
      setDraft(input);
      setMissions(next);
      setNotice('변경사항을 저장했습니다.');
      return true;
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function validateCurrent(): Promise<void> {
    if (!selected || !draft) return;
    const input = normalizeAdminMissionDraft(draft);
    setBusyAction('validate');
    setError('');
    setNotice('');
    try {
      if (dirty) {
        await api.updateAdminMission(selected.id, input);
        setDraft(input);
        setMissions(await api.adminMissions());
      }
      const validation = await api.validateAdminMission(selected.id);
      setReport(validation);
      setNotice(validation.ready ? 'Docker 검증을 통과했습니다.' : '검증 문제를 확인해주세요.');
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setBusyAction(null);
    }
  }

  async function togglePublish(publish: boolean): Promise<void> {
    if (!selected) return;
    setBusyAction(publish ? 'publish' : 'unpublish');
    setError('');
    try {
      if (publish) await api.publishAdminMission(selected.id);
      else await api.unpublishAdminMission(selected.id);
      setMissions(await api.adminMissions());
      setNotice(publish ? '미션을 공개했습니다.' : '미션을 비공개로 전환했습니다.');
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setBusyAction(null);
    }
  }

  async function duplicateCurrent(): Promise<void> {
    if (!selected) return;
    if (dirty && !window.confirm('저장하지 않은 변경을 버리고 미션을 복제할까요?')) return;
    setBusyAction('duplicate');
    setError('');
    try {
      const duplicate = await api.duplicateAdminMission(selected.id);
      await loadMissions(duplicate.id);
      setNotice('선택한 미션을 비공개 사본으로 만들었습니다.');
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
      setBusyAction(null);
    }
  }

  if (busyAction === 'load' && missions.length === 0) return <AdminStudioLoading />;
  if (error && missions.length === 0) {
    return (
      <div className="admin-studio-state">
        <strong>관리자 미션을 불러오지 못했습니다.</strong>
        <p>{error}</p>
        <button className="btn primary" onClick={() => void loadMissions()}>
          다시 시도
        </button>
      </div>
    );
  }
  if (!selected || !draft) return <AdminStudioLoading />;

  return (
    <section className="admin-studio">
      <AdminMissionSidebar
        missions={missions}
        selectedId={selectedId}
        search={search}
        busy={busyAction !== null}
        onSearch={setSearch}
        onSelect={selectMission}
        onDuplicate={() => void duplicateCurrent()}
      />

      <main className="admin-studio-main">
        <header className="admin-studio-header">
          <div className="admin-mission-heading">
            <div>
              <h1>{draft.title}</h1>
              {dirty && <span className="admin-unsaved">저장되지 않은 변경사항</span>}
            </div>
            <p>
              {selected.isPublished ? '공개' : '비공개'} <span>·</span>{' '}
              <strong className={report?.ready ? 'passed' : 'pending'}>
                {report?.ready ? '검증 통과' : '검증 필요'}
              </strong>
              <span>·</span> 마지막 수정 {formatAdminDate(selected.updatedAt)}
            </p>
          </div>
          <div className="admin-mission-paging">
            <button disabled={selectedIndex <= 0} onClick={() => moveSelection(-1)}>
              <ChevronLeft size={15} /> 이전
            </button>
            <span>
              {selectedIndex + 1} / {missions.length}
            </span>
            <button
              disabled={selectedIndex >= missions.length - 1}
              onClick={() => moveSelection(1)}
            >
              다음 <ChevronRight size={15} />
            </button>
            <button className="admin-more" aria-label="추가 메뉴" title="추가 관리 기능">
              <MoreVertical size={16} />
            </button>
          </div>
        </header>

        <nav className="admin-editor-tabs" aria-label="미션 편집 영역">
          {TAB_LABELS.map((item) => (
            <button
              className={tab === item.id ? 'active' : ''}
              onClick={() => setTab(item.id)}
              key={item.id}
            >
              {item.label}
              {item.id === 'tests' && <span>{draft.tests.length}</span>}
              {item.id === 'guidance' && <span>{draft.hints.length}</span>}
            </button>
          ))}
        </nav>

        {(error || notice) && (
          <div className={`admin-studio-message ${error ? 'error' : 'success'}`} aria-live="polite">
            {error || notice}
          </div>
        )}

        <AdminMissionEditor
          draft={draft}
          tab={tab}
          onChange={updateDraft}
          onResetCode={() =>
            updateDraft({
              ...draft,
              initialCode: selected.initialCode,
              referenceSolution: selected.referenceSolution,
            })
          }
        />
      </main>

      <AdminValidationPanel
        mission={selected}
        draft={draft}
        report={report}
        dirty={dirty}
        busyAction={busyAction}
        onValidate={() => void validateCurrent()}
        onSave={() => void saveCurrent()}
        onPreview={() => setPreviewOpen(true)}
        onPublish={() => void togglePublish(true)}
        onUnpublish={() => void togglePublish(false)}
      />

      {previewOpen && (
        <AdminPreviewDialog
          mission={selected}
          draft={draft}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </section>
  );
}

function AdminStudioLoading(): ReactElement {
  return (
    <div className="admin-studio-state">
      <LoaderCircle className="spin" size={22} />
      <strong>미션 스튜디오를 준비하고 있습니다.</strong>
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

function formatAdminDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
