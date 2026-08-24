import { useMemo, useState, type ReactElement } from 'react';
import { ChevronDown, ChevronRight, ListFilter, Plus, Search } from 'lucide-react';
import type { AdminMission } from '../../lib/admin-types.js';

type AdminMissionSidebarProps = {
  missions: AdminMission[];
  selectedId: string | null;
  search: string;
  busy: boolean;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onDuplicate: () => void;
};

type MissionGroup = {
  order: number;
  title: string;
  missions: AdminMission[];
};

export function AdminMissionSidebar({
  missions,
  selectedId,
  search,
  busy,
  onSearch,
  onSelect,
  onDuplicate,
}: AdminMissionSidebarProps): ReactElement {
  const selected = missions.find((mission) => mission.id === selectedId);
  const [collapsed, setCollapsed] = useState<Set<number>>(
    () =>
      new Set(
        missions
          .map((mission) => mission.chapter.sortOrder)
          .filter((order) => order !== selected?.chapter.sortOrder),
      ),
  );
  const groups = useMemo(() => groupMissions(missions, search), [missions, search]);

  const toggleGroup = (order: number): void => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  return (
    <aside className="admin-mission-sidebar" aria-label="관리자 미션 목록">
      <div className="admin-sidebar-heading">
        <div>
          <span className="admin-eyebrow">MISSION STUDIO</span>
          <h1>미션 목록</h1>
        </div>
        <span className="admin-sidebar-count">{missions.length}</span>
      </div>

      <label className="admin-search">
        <Search size={15} />
        <span className="sr-only">미션 검색</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="미션 제목, ID 검색…"
        />
        <ListFilter size={14} />
      </label>

      <div className="admin-mission-tree">
        {groups.map((group) => {
          const isCollapsed = !search && collapsed.has(group.order);
          const selectedChapter = selected?.chapter.sortOrder === group.order;
          return (
            <section className="admin-chapter-group" key={group.order}>
              <button
                className={`admin-chapter-toggle ${selectedChapter ? 'contains-selected' : ''}`}
                onClick={() => toggleGroup(group.order)}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span>
                  CH.{group.order} {group.title}
                </span>
                <strong>{group.missions.length}</strong>
              </button>
              {!isCollapsed && (
                <div className="admin-chapter-missions">
                  {group.missions.map((mission) => (
                    <button
                      className={`admin-tree-mission ${mission.id === selectedId ? 'active' : ''}`}
                      onClick={() => onSelect(mission.id)}
                      key={mission.id}
                    >
                      <span className="admin-tree-code">
                        CH.{group.order}-M.{mission.sortOrder}
                      </span>
                      <span className="admin-tree-title">{mission.title}</span>
                      <span
                        className={`admin-publish-dot ${mission.isPublished ? 'published' : ''}`}
                        aria-label={mission.isPublished ? '공개' : '비공개'}
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {groups.length === 0 && <p className="admin-empty">검색 결과가 없습니다.</p>}
      </div>

      <button className="admin-add-mission" disabled={!selectedId || busy} onClick={onDuplicate}>
        <Plus size={15} /> 새 미션 추가
      </button>
    </aside>
  );
}

function groupMissions(missions: AdminMission[], search: string): MissionGroup[] {
  const query = search.trim().toLowerCase();
  const filtered = missions.filter((mission) => {
    const code = `ch.${mission.chapter.sortOrder}-m.${mission.sortOrder}`;
    return !query || mission.title.toLowerCase().includes(query) || code.includes(query);
  });
  const groups = new Map<number, MissionGroup>();
  for (const mission of filtered) {
    const order = mission.chapter.sortOrder;
    const group = groups.get(order) ?? { order, title: mission.chapter.title, missions: [] };
    group.missions.push(mission);
    groups.set(order, group);
  }
  return [...groups.values()].sort((left, right) => left.order - right.order);
}
