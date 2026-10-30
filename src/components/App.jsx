import { useCallback, useEffect, useMemo, useState } from 'react';
import { LOCAL_STORAGE_KEY, PAGE_SIZE, status } from '../config';
import { useAdminData } from '../hooks/useAdminData';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { makeId, meanCenter, unionBBox } from '../utilities';
import DetailPanel from './DetailPanel';
import MapView from './MapView';
import SiteForm from './SiteForm';
import SiteList from './SiteList';

const defaultFilters = {
  query: '',
  status: 'all',
  theme: 'all',
  sort: 'name',
  onlyOnMap: true,
};
const groupOrder = Object.fromEntries(status.map((g, i) => [g.key, i]));

/**
 * Join a site to the city/municipality polygons it covers: either an explicit
 * list of LGUs (lguPcodes) or whole provinces (provincePcodes). The pin sits at
 * the mean of the LGU centroids unless the site gives its own `center`.
 */
function resolveSite(s, admin) {
  const lgus = [];
  const seen = new Set();
  const add = (l) => {
    if (l && !seen.has(l.pcode)) {
      seen.add(l.pcode);
      lgus.push(l);
    }
  };
  (s.lguPcodes ?? []).forEach((p) => add(admin.byPcode[p]));
  (s.provincePcodes ?? []).forEach((p) =>
    (admin.byProvince[p] ?? []).forEach(add),
  );
  if (!lgus.length) return null;

  const bbox = unionBBox(lgus.map((l) => l.bbox));
  const centers = (s.lguPcodes ?? [])
    .map((p) => admin.byPcode[p]?.center)
    .filter(Boolean);
  const lngLat =
    s.center ??
    (centers.length
      ? meanCenter(centers)
      : [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]);
  const first = lgus[0];
  return {
    ...s,
    lgus,
    bbox,
    lngLat,
    features: lgus.map((l) => l.feature),
    region: first.region,
    regionPcode: first.regionPcode,
    provinces: [...new Set(lgus.map((l) => l.province))],
  };
}

export default function App({ dataBase, height, sitesUrl, styleUrl }) {
  const admin = useAdminData(`${dataBase}lgu.geojson`);

  // Directory sites (in production: sites.json maintained by FPE)
  const [published, setPublished] = useState([]);
  // Demo-only: entries typed into the form on this page
  const [local, setLocal] = useLocalStorageState([], LOCAL_STORAGE_KEY);

  const [tab, setTab] = useState('browse'); // 'browse' | 'add'
  const [selectedId, setSelectedId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [bounds, setBounds] = useState(null);
  const [focus, setFocus] = useState(null);
  const [previewPcode, setPreviewPcode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(sitesUrl)
      .then((r) => (r.ok ? r.json() : []))
      .then(
        (rows) => !cancelled && setPublished(Array.isArray(rows) ? rows : []),
      )
      .catch(() => !cancelled && setPublished([]));
    return () => {
      cancelled = true;
    };
  }, [sitesUrl]);

  const pins = useMemo(() => {
    if (admin.status !== 'ready') return [];
    return [...local, ...published]
      .map((s) => resolveSite(s, admin))
      .filter(Boolean);
  }, [local, published, admin]);

  const matching = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    

    return pins.filter((s) => {
      if (filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.theme !== 'all' && !(s.themes ?? []).includes(filters.theme))
        return false;
      if (q) {
        const hay =
          `${s.name} ${s.locationText ?? ''} ${s.provinces.join(' ')} ${s.lgus
            .map((l) => l.name)
            .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pins, filters.status, filters.theme, filters.query]);

  const onMap = useMemo(
    () =>
      bounds ? matching.filter((s) => bounds.contains(s.lngLat)) : matching,
    [matching, bounds],
  );

  const listItems = useMemo(() => {
    const sorted = [...(filters.onlyOnMap ? onMap : matching)];
    const byName = (a, b) => a.name.localeCompare(b.name, 'en');
    const byStatus = (a, b) => a.status.localeCompare(b.status, 'en');
    if (filters.sort === 'status') {
      sorted.sort(byStatus);
    } else if (filters.sort === 'newest') {
      sorted.sort(
        (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || byName(a, b),
      );
    } else sorted.sort(byName);
    return sorted;
  }, [filters.onlyOnMap, filters.sort, onMap, matching]);

  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const previewLgu = admin.byPcode[previewPcode] ?? null;
  const highlight = selected
    ? selected.features
    : previewLgu
      ? [previewLgu.feature]
      : null;

  const handleBoundsChange = useCallback((b) => setBounds(b), []);
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setShowDetail(Boolean(id));
    if (id) setTab('browse');
  }, []);
  const updateFilters = (f) => {
    setFilters(f);
    setVisibleCount(PAGE_SIZE);
  };

  function handlePreview(pcode) {
    setPreviewPcode(pcode);
    const lgu = pcode && admin.byPcode[pcode];
    if (lgu) setFocus({ bbox: lgu.bbox, token: Date.now() });
  }

  function handleSubmit(data) {
    const entry = { ...data, id: makeId(), createdAt: Date.now(), demo: true };
    setLocal([entry, ...local]);
    setPreviewPcode(null);
    setFilters({ ...defaultFilters, onlyOnMap: false, sort: 'newest' });
    setTab('browse');
    setSelectedId(entry.id);
    setShowDetail(true);
  }

  const totalLabel = `${pins.length} priority site${pins.length === 1 ? '' : 's'}`;

  return (
    <div className="fpe" style={{ '--fpe-height': height }}>
      <aside className="fpe-side">
        <header className="fpe-head">
          <p className="fpe-eyebrow">
            Foundation for the Philippine Environment
          </p>
          <h2 className="fpe-title">Priority Conservation Sites</h2>
          <p className="fpe-sub">
            Where FPE works with communities to protect biodiversity ·{' '}
            {totalLabel}
          </p>
          <div className="fpe-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'browse'}
              className={tab === 'browse' ? 'is-on' : ''}
              onClick={() => {
                setTab('browse');
                setPreviewPcode(null);
              }}
            >
              Browse
            </button>
            <button
              role="tab"
              aria-selected={tab === 'add'}
              className={tab === 'add' ? 'is-on' : ''}
              onClick={() => {
                setTab('add');
                setSelectedId(null);
                setShowDetail(false);
              }}
            >
              Add a site (demo)
            </button>
          </div>
        </header>

        <div className="fpe-body">
          {admin.status === 'loading' && (
            <p className="fpe-empty">Loading map data…</p>
          )}
          {admin.status === 'error' && (
            <p className="fpe-error">{admin.error}</p>
          )}

          {admin.status === 'ready' && tab === 'add' && (
            <SiteForm
              regions={admin.regions}
              onPreview={handlePreview}
              onSubmit={handleSubmit}
              onCancel={() => setTab('browse')}
            />
          )}

          {admin.status === 'ready' &&
            tab === 'browse' &&
            showDetail &&
            selected && (
              <DetailPanel
                site={selected}
                onBack={() => {
                  setShowDetail(false);
                  setSelectedId(null);
                }}
              />
            )}

          {admin.status === 'ready' &&
            tab === 'browse' &&
            !(showDetail && selected) && (
              <SiteList
                items={listItems}
                total={matching.length}
                onMapOnly={onMap.length}
                filters={filters}
                setFilters={updateFilters}
                onSelect={handleSelect}
                selectedId={selectedId}
                visibleCount={visibleCount}
                onShowMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
                demoCount={local.length}
                onClearDemo={() => {
                  setLocal([]);
                  setSelectedId(null);
                  setShowDetail(false);
                }}
              />
            )}
        </div>
      </aside>

      <MapView
        pins={pins}
        selectedId={selectedId}
        onSelect={handleSelect}
        onOpenPanel={() => {
          setTab('browse');
          setShowDetail(true);
        }}
        onBoundsChange={handleBoundsChange}
        highlight={highlight}
        focus={focus}
        styleUrl={styleUrl}
      />
    </div>
  );
}
