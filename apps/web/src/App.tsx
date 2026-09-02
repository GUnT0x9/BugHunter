import { useEffect, useState, type ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import type { MissionPublic, User } from '@bughunter/contracts';
import { api } from './lib/api.js';
import { AuthScreen } from './components/AuthScreen.js';
import { Shell, type Progress } from './components/Shell.js';
import { Dashboard } from './components/Dashboard.js';
import { Roadmap } from './components/Roadmap.js';
import { MissionDirectory } from './components/MissionDirectory.js';
import { BugDex } from './components/BugDex.js';
import { Statistics } from './components/Statistics.js';
import { Profile } from './components/Profile.js';
import { UserSearch } from './components/UserSearch.js';
import { PublicProfile } from './components/PublicProfile.js';
import { Workspace } from './components/Workspace.js';
import { ProgressBar } from './components/ui/ProgressBar.js';
import { AdminMissionStudio } from './components/admin/AdminMissionStudio.js';
import { AdminSubmissionLogs } from './components/admin/AdminSubmissionLogs.js';
import { Achievements } from './components/Achievements.js';
import { QuestBoard } from './components/QuestBoard.js';
import { Rankings } from './components/Rankings.js';
import { Challenges } from './components/Challenges.js';

function BootScreen(): ReactElement {
  return (
    <main className="boot-screen">
      <div className="boot-box">
        <div className="boot-brand">
          <img src="/debugrove-icon.png" alt="" /> Debugrove
        </div>
        <p className="boot-sub">준비 중입니다…</p>
        <ProgressBar value={60} max={100} />
      </div>
    </main>
  );
}

export function App(): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void api
      .me()
      .then(setUser)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <BootScreen />;
  return user ? (
    <BrowserRouter>
      <AuthenticatedApp user={user} onUserUpdated={setUser} onLogout={() => setUser(null)} />
    </BrowserRouter>
  ) : (
    <AuthScreen onAuthenticated={setUser} />
  );
}

function AuthenticatedApp({
  user,
  onUserUpdated,
  onLogout,
}: {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}): ReactElement {
  const [missions, setMissions] = useState<MissionPublic[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState('');

  const refresh = async (): Promise<void> => {
    try {
      const [nextMissions, nextProgress] = await Promise.all([api.missions(), api.progress()]);
      setMissions(nextMissions);
      setProgress(nextProgress);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    }
  };

  useEffect(() => {
    void refresh();
    const refreshPublishedMissions = () => {
      void api
        .missions()
        .then(setMissions)
        .catch(() => null);
    };
    const timer = window.setInterval(refreshPublishedMissions, 30_000);
    window.addEventListener('focus', refreshPublishedMissions);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshPublishedMissions);
    };
  }, []);

  async function logout(): Promise<void> {
    await api.logout().catch(() => null);
    onLogout();
  }

  return (
    <Shell user={user} progress={progress} onLogout={() => void logout()}>
      {error && (
        <div className="page">
          <p className="form-error">{error}</p>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Dashboard progress={progress} missions={missions} />} />
        <Route path="/learn" element={<Roadmap missions={missions} />} />
        <Route path="/problems" element={<MissionDirectory missions={missions} />} />
        <Route
          path="/problems/:id"
          element={<MissionRoute missions={missions} onComplete={() => void refresh()} />}
        />
        <Route path="/bugdex" element={<BugDex />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/quests" element={<QuestBoard onReward={() => void refresh()} />} />
        <Route
          path="/my"
          element={<Profile user={user} progress={progress} onUserUpdated={onUserUpdated} />}
        />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/search" element={<UserSearch />} />
        <Route path="/community" element={<Navigate to="/search" replace />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route
          path="/challenges"
          element={<Challenges missions={missions} onReward={() => void refresh()} />}
        />
        <Route
          path="/challenges/duel"
          element={<Challenges mode="duel" missions={missions} onReward={() => void refresh()} />}
        />
        <Route
          path="/challenges/co-op"
          element={<Challenges mode="coop" missions={missions} onReward={() => void refresh()} />}
        />
        <Route
          path="/challenges/event"
          element={<Challenges mode="event" missions={missions} onReward={() => void refresh()} />}
        />
        <Route path="/community/users/:id" element={<PublicProfile />} />
        <Route path="/roadmap" element={<Navigate to="/learn" replace />} />
        <Route path="/missions" element={<Navigate to="/problems" replace />} />
        <Route path="/missions/:id" element={<LegacyMissionRedirect />} />
        <Route path="/profile" element={<Navigate to="/my" replace />} />
        <Route
          path="/admin/missions"
          element={
            user.role === 'ADMIN' ? (
              <AdminMissionStudio onPublished={() => void refresh()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/submissions"
          element={user.role === 'ADMIN' ? <AdminSubmissionLogs /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function MissionRoute({
  missions,
  onComplete,
}: {
  missions: MissionPublic[];
  onComplete: () => void;
}): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<MissionPublic | null>(
    () => missions.find((m) => m.id === id) ?? null,
  );
  const [loading, setLoading] = useState(!mission);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = missions.find((m) => m.id === id);
    if (cached) {
      setMission(cached);
      setLoading(false);
      return;
    }
    if (!id) return;
    setLoading(true);
    void api
      .mission(id)
      .then((m) => {
        setMission(m);
        setError('');
      })
      .catch((e: unknown) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, missions]);

  if (loading)
    return (
      <div className="page">
        <p className="muted">미션을 불러오는 중입니다…</p>
      </div>
    );
  if (error || !mission)
    return (
      <div className="page">
        <p className="form-error">{error || '미션을 찾을 수 없습니다.'}</p>
        <button className="btn" onClick={() => navigate('/problems')}>
          문제 목록으로
        </button>
      </div>
    );

  return <Workspace mission={mission} onBack={() => navigate(-1)} onComplete={onComplete} />;
}

function LegacyMissionRedirect(): ReactElement {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/problems/${id}` : '/problems'} replace />;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}
