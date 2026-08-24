import { useState, type FormEvent, type ReactElement } from 'react';
import { Bug, Code2, ShieldCheck, Terminal } from 'lucide-react';
import type { User } from '@bughunter/contracts';
import { api } from '../lib/api.js';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }): ReactElement {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ email, username, password });
      onAuthenticated(user);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-hero-inner">
            <div className="auth-hero-badge">45 MISSIONS · 7 CHAPTERS · PYTHON 3.12</div>
            <h1 className="auth-hero-title">
              버그를
              <br />
              사냥하는 법을
              <br />
              배운다.
            </h1>
            <p className="auth-hero-desc">
              깨진 코드를 직접 고치며 디버깅 근육을 키웁니다.
              <br />
              터미널에서 바로 실행하고, 제출하면 Docker 격리 채점이 돌아갑니다.
            </p>

            <div className="auth-code-card">
              <div className="auth-code-head">
                <span className="auth-code-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="auth-code-file">
                  <Terminal size={12} /> main.py
                </span>
                <span className="auth-code-tag">Syntax Bug</span>
              </div>
              <pre className="auth-code-body">
                <span className="ac-line">
                  <span className="ac-num">1</span>
                  <span className="ac-err">print("BugHunter"</span>
                </span>
                <span className="ac-line ac-fix">
                  <span className="ac-num">1</span>print("BugHunter")
                </span>
                <span className="ac-hint">↳ 닫는 괄호 `)` 를 추가하세요</span>
              </pre>
            </div>

          </div>
        </section>

        <section className="auth-form-side">
          <div className="auth-card">
            <div className="auth-brand">
              <span className="auth-brand-mark">
                <Bug size={18} />
              </span>
              <span>BugHunter</span>
              <span className="auth-brand-ver">PYTHON EDITION</span>
            </div>

            <div className="auth-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                type="button"
              >
                로그인
              </button>
              <button
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                type="button"
              >
                회원가입
              </button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {mode === 'register' && (
                <label className="field">
                  <span className="field-label">닉네임</span>
                  <input
                    required
                    minLength={2}
                    maxLength={32}
                    autoComplete="nickname"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="예: 버그탐정"
                  />
                </label>
              )}
              <label className="field">
                <span className="field-label">이메일</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoFocus={mode === 'login'}
                />
              </label>
              <label className="field">
                <span className="field-label">비밀번호</span>
                <input
                  required
                  minLength={8}
                  maxLength={128}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상"
                />
                <span className="field-hint">영문·숫자 조합 8자 이상을 권장합니다.</span>
              </label>
              {error && (
                <p className="form-error" role="alert" aria-live="polite">
                  {error}
                </p>
              )}
              <div className="auth-actions">
                <button className="btn primary block auth-submit" type="submit" disabled={busy}>
                  {busy ? '처리 중…' : mode === 'login' ? '로그인' : '계정 만들기'}
                </button>
                <p className="auth-switch">
                  {mode === 'login' ? '처음 오셨나요?' : '이미 계정이 있나요?'}{' '}
                  <button
                    type="button"
                    className="auth-switch-btn"
                    disabled={busy}
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError('');
                    }}
                  >
                    {mode === 'login' ? '회원가입' : '로그인'}
                  </button>
                </p>
              </div>
            </form>

            <div className="auth-trust">
              <span>
                <Code2 size={12} /> Docker 격리 채점
              </span>
              <span>
                <ShieldCheck size={12} /> HttpOnly 세션
              </span>
            </div>
          </div>
          <p className="auth-foot">계속 진행하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.</p>
        </section>
      </div>
    </main>
  );
}
