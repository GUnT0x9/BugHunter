import type { ReactElement } from 'react';
import { Flag, Swords, Users } from 'lucide-react';

export function Challenges(): ReactElement {
  return (
    <section className="page challenges-page">
      <header className="challenges-hero">
        <div>
          <span className="page-kicker">LIVE OPERATIONS</span>
          <h1>챌린지</h1>
          <p>혼자 쌓은 실력을 공동 목표와 경쟁 기록으로 확장합니다.</p>
        </div>
        <Swords />
      </header>
      <div className="challenge-mode-grid">
        <article>
          <Users />
          <span>CO-OP</span>
          <h2>협동 목표</h2>
          <p>전체 디버거가 함께 목표치를 채우는 공동 작전입니다.</p>
          <small>규칙 설정 대기</small>
        </article>
        <article>
          <Flag />
          <span>COMMUNITY</span>
          <h2>커뮤니티 이벤트</h2>
          <p>기간과 카테고리가 바뀌는 테마형 도전입니다.</p>
          <small>규칙 설정 대기</small>
        </article>
        <article>
          <Swords />
          <span>HEAD TO HEAD</span>
          <h2>같은 문제 경쟁</h2>
          <p>동일 문제의 해결 기록을 공정한 기준으로 비교합니다.</p>
          <small>규칙 설정 대기</small>
        </article>
      </div>
    </section>
  );
}
