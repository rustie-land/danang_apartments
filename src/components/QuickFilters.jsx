import { useFilters } from '../FiltersContext.jsx';

export default function QuickFilters({ onAllFilters }) {
  const { pets, setPets, noCommission, setNoCommission, term, setTerm, repair, setRepair } = useFilters();

  const items = [
    { id: 'pets', label: 'Pets', active: pets, toggle: () => setPets(!pets) },
    { id: 'nocomm', label: 'No commission', active: noCommission, toggle: () => setNoCommission(!noCommission) },
    { id: 'term', label: 'Long term', active: term !== 'Any', toggle: () => setTerm(term === 'Any' ? '1yr+' : 'Any') },
    { id: 'repair', label: 'Repair', active: repair, toggle: () => setRepair(!repair) },
  ];

  return (
    <div className="as-ribbon">
      {items.map((q) => (
        <button
          key={q.id}
          className={`as-pill ${q.active ? 'active' : ''}`}
          onClick={q.toggle}
        >
          {q.label}
        </button>
      ))}
      <button className="as-pill all" onClick={onAllFilters}>All filters</button>
    </div>
  );
}
