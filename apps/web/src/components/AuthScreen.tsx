import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import type { User } from '@bughunter/contracts';
import { api } from '../lib/api.js';

type AuthMode = 'login' | 'register';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

function passwordStrength(password: string): { label: string; level: number } {
  if (!password) return { label: '', level: 0 };

  let level = password.length >= 8 ? 1 : 0;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) level += 1;
  if (password.length >= 12 || /[^a-zA-Z0-9]/.test(password)) level += 1;

  return {
    label: level === 3 ? '안전' : level === 2 ? '보통' : '약함',
    level: Math.max(1, level),
  };
}

export function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void;
}): ReactElement {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const strength = passwordStrength(password);

  useEffect(() => {
    void api
      .googleStatus()
      .then(({ enabled }) => setGoogleEnabled(enabled))
      .catch(() => null);
    if (new URLSearchParams(window.location.search).get('authError') === 'google') {
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function changeMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setPassword('');
    setPasswordConfirm('');
    setShowPassword(false);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');

    if (mode === 'register' && password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }
    if (mode === 'register' && !agreed) {
      setError('이용약관 및 개인정보 처리방침에 동의해주세요.');
      return;
    }

    setBusy(true);
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

  const isRegister = mode === 'register';

  return (
    <main className="auth-screen">
      <header className="auth-header">
        <button className="auth-logo" type="button" onClick={() => changeMode('login')}>
          <span className="auth-logo-mark">
            <img src="/debugrove-icon.png" alt="" />
          </span>
          <span>Debugrove</span>
        </button>
        {isRegister && (
          <button className="auth-back" type="button" onClick={() => changeMode('login')}>
            <ArrowLeft size={15} /> 로그인으로
          </button>
        )}
      </header>

      <section className="auth-content" aria-labelledby="auth-title">
        <div className="auth-heading">
          <span className="auth-eyebrow">DEBUGROVE · PYTHON DEBUGGING</span>
          <h1 id="auth-title">
            {isRegister ? (
              <span className="auth-typewriter auth-typewriter-register">ENTER THE HUNT_</span>
            ) : (
              <span className="auth-typewriter auth-typewriter-brand">
                디버깅으로 배우는 Python
              </span>
            )}
          </h1>
          <p>
            {isRegister
              ? '계정을 만들고 첫 번째 디버깅 미션에 도전해 보세요.'
              : '깨진 코드를 직접 고치고 실행하며 파이썬 디버깅과 문제 해결력을 키워보세요.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label className="field">
              <span className="field-label">사용자 이름</span>
              <input
                required
                minLength={2}
                maxLength={32}
                autoComplete="nickname"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="다른 헌터에게 표시될 이름"
                autoFocus
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
              placeholder="name@example.com"
              autoFocus={!isRegister}
            />
          </label>

          <label className="field">
            <span className="field-label">비밀번호</span>
            <span className="password-field">
              <input
                required
                minLength={8}
                maxLength={128}
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? '8자 이상 입력해주세요' : '비밀번호를 입력해주세요'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {isRegister && password && (
            <div className={`password-strength strength-${strength.level}`} aria-live="polite">
              <div className="password-strength-bar" aria-hidden="true">
                <span />
              </div>
              <span>비밀번호 안전도</span>
              <strong>{strength.label}</strong>
            </div>
          )}

          {isRegister && (
            <label className="field">
              <span className="field-label">비밀번호 확인</span>
              <span className="password-field">
                <input
                  required
                  minLength={8}
                  maxLength={128}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="비밀번호를 한 번 더 입력해주세요"
                />
                {passwordConfirm && password === passwordConfirm && (
                  <span className="password-match" aria-label="비밀번호 일치">
                    <Check size={17} />
                  </span>
                )}
              </span>
            </label>
          )}

          {isRegister && (
            <label className="auth-consent">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span className="auth-checkbox" aria-hidden="true">
                <Check size={13} />
              </span>
              <span>
                <strong>이용약관</strong> 및 <strong>개인정보 처리방침</strong>에 동의합니다.
              </span>
            </label>
          )}

          {error && (
            <p className="form-error" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <button className="btn primary block auth-submit" type="submit" disabled={busy}>
            {busy ? '처리 중…' : isRegister ? '계정 만들기' : '로그인'}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="auth-divider">
              <span>또는</span>
            </div>
            <button
              className="btn auth-google"
              type="button"
              onClick={() => window.location.assign('/api/auth/google')}
            >
              <b aria-hidden="true">G</b>
              Google로 계속하기
            </button>
          </>
        )}

        <p className="auth-switch">
          {isRegister ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}
          <button
            type="button"
            disabled={busy}
            onClick={() => changeMode(isRegister ? 'login' : 'register')}
          >
            {isRegister ? '로그인' : '회원가입'}
          </button>
        </p>
      </section>
    </main>
  );
}
