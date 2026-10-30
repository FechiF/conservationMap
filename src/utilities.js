// ---- geometry helpers (GeoJSON, [lng, lat]) -------------------------------

function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function ringCentroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-12) return ring[0];
  return [cx / (3 * a), cy / (3 * a)];
}

/** Centroid of the largest polygon part, as [lng, lat]. */
export function geometryCenter(geometry) {
  const polys = polygonsOf(geometry);
  if (!polys.length) return null;
  let best = polys[0];
  let bestArea = Math.abs(ringArea(best[0]));
  for (const p of polys) {
    const a = Math.abs(ringArea(p[0]));
    if (a > bestArea) {
      best = p;
      bestArea = a;
    }
  }
  return ringCentroid(best[0]);
}

/** [west, south, east, north] */
export function geometryBBox(geometry) {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const poly of polygonsOf(geometry)) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < w) w = x;
        if (x > e) e = x;
        if (y < s) s = y;
        if (y > n) n = y;
      }
    }
  }
  return [w, s, e, n];
}

export function unionBBox(boxes) {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [bw, bs, be, bn] of boxes) {
    if (bw < w) w = bw;
    if (bs < s) s = bs;
    if (be > e) e = be;
    if (bn > n) n = bn;
  }
  return [w, s, e, n];
}

export function meanCenter(points) {
  const n = points.length;
  return [
    points.reduce((a, p) => a + p[0], 0) / n,
    points.reduce((a, p) => a + p[1], 0) / n,
  ];
}

// ---- misc ------------------------------------------------------------------

/** PSGC region code ("PH07") -> island group key. */
export function islandGroupOf(regionPcode) {
  const n = parseInt(String(regionPcode).slice(2), 10);
  if ([6, 7, 8].includes(n)) return 'visayas';
  if ([9, 10, 11, 12, 16, 19].includes(n)) return 'mindanao';
  return 'luzon';
}

export function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function makeId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** "Abra and Kalinga" style text if the site came with one, else the provinces. */
export function siteLocation(s) {
  return s.locationText?.trim() || s.provinces.join(', ');
}

/** Only allow http(s) links from data we don't control. */
export function safeUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}
