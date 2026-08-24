import { useState } from 'react';

const QUICK = [
  { id: 'pets', label: '🐾 Pets', dropdown: true },
  { id: 'nocomm', label: '🚫 No commission', dropdown: false },
  { id: 'term', label: '⏳ Term', dropdown: true },
  { id: 'repair', label: '🛠 Repair', dropdown: true },
];

export default function QuickFilters({ onAllFilters }) {
  const [active, setActive] = useState({ pets: true, nocomm: false, term: false, repair: false });

  return (
    <div className="as-ribbon">
      {QUICK.map((q) => (
        <button
          key={q.id}
          className={`as-pill ${active[q.id] ? 'active' : ''}`}
          onClick={() => setActive((a) => ({ ...a, [q.id]: !a[q.id] }))}
        >
          {q.label}{q.dropdown && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▾</span>}
        </button>
      ))}
      <button className="as-pill all" onClick={onAllFilters}>🎛 All filters (3)</button>
    </div>
  );
}
