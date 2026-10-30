import { themeLabel } from '../config';
import { formatDate, safeUrl, siteLocation } from '../utilities';
import { StatusTag } from './SiteList';

export default function DetailPanel({ site: s, onBack }) {
  const link = safeUrl(s.url);
  const names = s.lgus.map((l) => l.name.replace(/\s*\(.*?\)\s*/g, ' ').trim());

  return (
    <article className="fpe-detail">
      <button type="button" className="fpe-link" onClick={onBack}>
        ← Back to list
      </button>

      {s.image && (
        <img
          className="fpe-detail__img"
          src={s.image}
          alt={s.name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <header>
        <StatusTag status={s.staus} />
        <h2>{s.name}</h2>
        <p className="fpe-muted">{siteLocation(s)}</p>
      </header>

      {s.demo && (
        <p className="fpe-note">
          Demo entry — added in this browser only, not part of FPE's directory.
        </p>
      )}

      {s.themes?.length > 0 && (
        <ul className="fpe-chips">
          {s.themes.map((t) => (
            <li key={t}>{themeLabel(t)}</li>
          ))}
        </ul>
      )}

      <h3>About the site</h3>
      {s.summary ? (
        <p className="fpe-detail__text">{s.summary}</p>
      ) : (
        <p className="fpe-muted">
          A write-up for this site isn't available here yet.
        </p>
      )}

      <dl className="fpe-facts">
        <div>
          <dt>Region</dt>
          <dd>{s.region}</dd>
        </div>
        <div>
          <dt>{s.provinces.length > 1 ? 'Provinces' : 'Province'}</dt>
          <dd>{s.provinces.join(', ')}</dd>
        </div>
        {s.lgus.length <= 8 && (
          <div>
            <dt>Cities / municipalities</dt>
            <dd>{names.join(', ')}</dd>
          </div>
        )}
        {s.createdAt && (
          <div>
            <dt>Added</dt>
            <dd>{formatDate(s.createdAt)}</dd>
          </div>
        )}
      </dl>

      {link && (
        <a
          className="fpe-btn fpe-btn--accent"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {s.demo ? 'Visit link' : 'View on fpe.ph'} →
        </a>
      )}
    </article>
  );
}
