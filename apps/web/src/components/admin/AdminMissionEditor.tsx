import type { ReactElement } from 'react';
import Editor, { type BeforeMount } from '@monaco-editor/react';
import { Eye, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { AdminMissionDraft } from '../../lib/admin-types.js';
import { installBugHunterTheme } from '../../lib/monaco-theme.js';

export type AdminStudioTab = 'details' | 'code' | 'tests' | 'guidance';

type AdminMissionEditorProps = {
  draft: AdminMissionDraft;
  tab: AdminStudioTab;
  onChange: (next: AdminMissionDraft) => void;
  onResetCode: () => void;
  chapters: Array<{ id: string; sortOrder: number; title: string }>;
  bugTypes: Array<{ id: string; name: string }>;
};

const beforeMount: BeforeMount = (monaco) => installBugHunterTheme(monaco);

export function AdminMissionEditor({
  draft,
  tab,
  onChange,
  onResetCode,
  chapters,
  bugTypes,
}: AdminMissionEditorProps): ReactElement {
  return (
    <>
      <div className="admin-editor-view" hidden={tab !== 'code'}>
        <CodeEditor draft={draft} onChange={onChange} onResetCode={onResetCode} />
      </div>
      {tab === 'details' && (
        <DetailsEditor draft={draft} onChange={onChange} chapters={chapters} bugTypes={bugTypes} />
      )}
      {tab === 'tests' && <TestsEditor draft={draft} onChange={onChange} />}
      {tab === 'guidance' && <GuidanceEditor draft={draft} onChange={onChange} />}
    </>
  );
}

function CodeEditor({
  draft,
  onChange,
  onResetCode,
}: Pick<AdminMissionEditorProps, 'draft' | 'onChange' | 'onResetCode'>): ReactElement {
  const setCode = (key: 'initialCode' | 'referenceSolution', value: string): void => {
    onChange({ ...draft, [key]: value });
  };
  return (
    <div className="admin-code-stack">
      <section className="admin-code-section">
        <header>
          <span>
            초기 코드 <small>학습자에게 제공되는 버그 코드</small>
          </span>
          <button className="admin-inline-action" onClick={onResetCode}>
            <RotateCcw size={13} /> 초기화
          </button>
        </header>
        <div className="admin-code-editor">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="bughunter-terminal"
            beforeMount={beforeMount}
            value={draft.initialCode}
            onChange={(value) => setCode('initialCode', value ?? '')}
            options={editorOptions}
          />
        </div>
      </section>
      <section className="admin-code-section">
        <header>
          <span>
            정답 코드 <small>Docker 채점의 기준 코드</small>
          </span>
          <span className="admin-code-language">Python 3.12</span>
        </header>
        <div className="admin-code-editor">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="bughunter-terminal"
            beforeMount={beforeMount}
            value={draft.referenceSolution}
            onChange={(value) => setCode('referenceSolution', value ?? '')}
            options={editorOptions}
          />
        </div>
      </section>
    </div>
  );
}

const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: 21,
  padding: { top: 13 },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line' as const,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Pretendard', monospace",
};

function DetailsEditor({
  draft,
  onChange,
  chapters,
  bugTypes,
}: Pick<AdminMissionEditorProps, 'draft' | 'onChange' | 'chapters' | 'bugTypes'>): ReactElement {
  return (
    <div className="admin-form-scroll">
      <div className="admin-form-grid">
        <Field label="챕터">
          <select
            value={draft.chapterId}
            onChange={(event) => onChange({ ...draft, chapterId: event.target.value })}
          >
            {chapters.map((chapter) => (
              <option value={chapter.id} key={chapter.id}>
                CH.{chapter.sortOrder} {chapter.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="버그 카테고리">
          <select
            value={draft.bugTypeId}
            onChange={(event) => onChange({ ...draft, bugTypeId: event.target.value })}
          >
            {bugTypes.map((bugType) => (
              <option value={bugType.id} key={bugType.id}>
                {bugType.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="챕터 내 순서">
          <input
            type="number"
            min={1}
            value={draft.sortOrder}
            onChange={(event) => onChange({ ...draft, sortOrder: Number(event.target.value) })}
          />
        </Field>
        <Field label="미션 제목" wide>
          <input
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
          />
        </Field>
        <Field label="Slug" wide>
          <input
            value={draft.slug}
            onChange={(event) => onChange({ ...draft, slug: event.target.value })}
          />
        </Field>
        <Field label="난이도">
          <select
            value={draft.difficulty}
            onChange={(event) => onChange({ ...draft, difficulty: Number(event.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option value={value} key={value}>
                {value} · {'★'.repeat(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="기본 XP">
          <input
            type="number"
            min={1}
            value={draft.baseXp}
            onChange={(event) => onChange({ ...draft, baseXp: Number(event.target.value) })}
          />
        </Field>
        <Field label="문제 설명" wide>
          <textarea
            rows={6}
            value={draft.description}
            onChange={(event) => onChange({ ...draft, description: event.target.value })}
          />
        </Field>
        <Field label="정답 해설" wide>
          <textarea
            rows={6}
            value={draft.explanation}
            onChange={(event) => onChange({ ...draft, explanation: event.target.value })}
          />
        </Field>
        <label className="admin-check-field admin-form-wide">
          <input
            type="checkbox"
            checked={draft.isBoss}
            onChange={(event) => onChange({ ...draft, isBoss: event.target.checked })}
          />
          Chapter 보스 미션으로 표시
        </label>
      </div>
    </div>
  );
}

function TestsEditor({
  draft,
  onChange,
}: Pick<AdminMissionEditorProps, 'draft' | 'onChange'>): ReactElement {
  const updateTest = (index: number, patch: Partial<AdminMissionDraft['tests'][number]>): void => {
    const tests = draft.tests.map((test, testIndex) =>
      testIndex === index ? { ...test, ...patch } : test,
    );
    onChange({ ...draft, tests });
  };
  const removeTest = (index: number): void => {
    onChange({ ...draft, tests: draft.tests.filter((_, testIndex) => testIndex !== index) });
  };
  return (
    <div className="admin-form-scroll">
      <div className="admin-test-toolbar">
        <span>공개·숨김 Test Case를 실제 입출력 기준으로 관리합니다.</span>
        <button
          className="admin-inline-action"
          onClick={() =>
            onChange({
              ...draft,
              tests: [...draft.tests, { input: '', expectedOutput: '', isHidden: true }],
            })
          }
        >
          <Plus size={13} /> 테스트 추가
        </button>
      </div>
      <div className="admin-test-editor-list">
        {draft.tests.map((test, index) => (
          <section className="admin-test-editor-row" key={`${index}-${test.isHidden}`}>
            <header>
              <strong>테스트 {index + 1}</strong>
              <label>
                <Eye size={13} />
                <input
                  type="checkbox"
                  checked={test.isHidden}
                  onChange={(event) => updateTest(index, { isHidden: event.target.checked })}
                />
                숨김
              </label>
              <button
                aria-label={`테스트 ${index + 1} 삭제`}
                disabled={draft.tests.length <= 3}
                onClick={() => removeTest(index)}
              >
                <Trash2 size={14} />
              </button>
            </header>
            <label>
              입력
              <textarea
                rows={3}
                value={test.input}
                onChange={(event) => updateTest(index, { input: event.target.value })}
              />
            </label>
            <label>
              기대 출력
              <textarea
                rows={3}
                value={test.expectedOutput}
                onChange={(event) => updateTest(index, { expectedOutput: event.target.value })}
              />
            </label>
          </section>
        ))}
      </div>
    </div>
  );
}

function GuidanceEditor({
  draft,
  onChange,
}: Pick<AdminMissionEditorProps, 'draft' | 'onChange'>): ReactElement {
  const hints = [...draft.hints];
  while (hints.length < 3) hints.push('');
  return (
    <div className="admin-form-scroll">
      <div className="admin-form-grid">
        {hints.slice(0, 3).map((hint, index) => (
          <Field label={`힌트 ${index + 1}`} wide key={index}>
            <textarea
              rows={4}
              value={hint}
              onChange={(event) => {
                const nextHints = [...hints];
                nextHints[index] = event.target.value;
                onChange({ ...draft, hints: nextHints.slice(0, 3) });
              }}
            />
          </Field>
        ))}
        <Field label="관련 개념 · 한 줄에 하나" wide>
          <textarea
            rows={5}
            value={draft.concepts.join('\n')}
            onChange={(event) =>
              onChange({
                ...draft,
                concepts: event.target.value.split('\n'),
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactElement;
}): ReactElement {
  return (
    <label className={wide ? 'admin-form-field admin-form-wide' : 'admin-form-field'}>
      <span>{label}</span>
      {children}
    </label>
  );
}
