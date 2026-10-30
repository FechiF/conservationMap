import {
  statusColor,
  statusLabel,
  status,
  themeLabel,
  themeOptions,
  sortOptions,
  PAGE_SIZE,
} from '../config';
import { siteLocation } from '../utilities';

export function StatusTag({ status }) {
  return (
    <span
      className="fpe-tag fpe-tag-status"
      style={{ '--tag': statusColor(status) }}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function SiteList({
  items,
  total,
  onMapOnly,
  filters,
  setFilters,
  onSelect,
  selectedId,
  visibleCount,
  onShowMore,
  demoCount,
  onClearDemo,
}) {
  const shown = items.slice(0, visibleCount);

  return (
    <div className="fpe-list">
      <div className="fpe-filters">
        <input
          type="search"
          placeholder="Search site, province or municipality"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          aria-label="Search sites"
        />
        <div className="fpe-filters__row">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            {status.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.theme}
            onChange={(e) => setFilters({ ...filters, theme: e.target.value })}
            aria-label="Filter by habitat type"
          >
            <option value="all">All themes</option>
            {themeOptions.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            aria-label="Sort"
          >
            {sortOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <label className="fpe-check fpe-check--small">
          <input
            type="checkbox"
            checked={filters.onlyOnMap}
            onChange={(e) =>
              setFilters({ ...filters, onlyOnMap: e.target.checked })
            }
          />
          Only list sites shown on the map
        </label>
      </div>

      <div className="fpe-legend" aria-label="Map legend">
        {status.map((g) => (
          <span key={g.key}>
            <i style={{ background: g.color }} /> {g.label}
          </span>
        ))}
      </div>

      <p className="fpe-count">
        {filters.onlyOnMap && (
          <span className="is-active">
            On map: {onMapOnly.toLocaleString()} ·{' '}
          </span>
        )}
        Total: {total.toLocaleString()}
      </p>

      {shown.length === 0 ? (
        <p className="fpe-empty">
          No sites match. Zoom the map out or clear the filters.
        </p>
      ) : (
        <ul className="fpe-cards">
          {shown.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`fpe-card${s.id === selectedId ? ' is-selected' : ''}`}
                style={{ '--tag': statusColor(s.status) }}
                onClick={() => onSelect(s.id)}
              >
                <span className="fpe-card__body">
                  <strong>{s.name}</strong>
                  <span className="fpe-card__place">{siteLocation(s)}</span>
                  <span className="fpe-card__meta">
                    <StatusTag status={s.status} />
                    {s.themes?.slice(0, 2).map((t) => (
                      <span className="fpe-tag" key={t}>
                        {themeLabel(t)}
                      </span>
                    ))}
                    {s.demo && <span className="fpe-demo-badge">Demo</span>}
                  </span>
                </span>
                {s.image && (
                  <img
                    className="fpe-card__img"
                    src={s.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > visibleCount && (
        <button
          type="button"
          className="fpe-btn fpe-btn--block"
          onClick={onShowMore}
        >
          Show {Math.min(PAGE_SIZE, items.length - visibleCount)} more
        </button>
      )}

      {demoCount > 0 && (
        <p className="fpe-clear">
          {demoCount} demo entr{demoCount === 1 ? 'y' : 'ies'} saved in this
          browser.{' '}
          <button type="button" className="fpe-link" onClick={onClearDemo}>
            Clear demo entries
          </button>
        </p>
      )}
    </div>
  );
}
