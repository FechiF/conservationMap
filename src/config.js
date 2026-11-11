// Free, keyless vector basemap (OpenFreeMap). Swap for MapTiler/Stadia/self-hosted if needed.
export const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const mapDefaults = {
  // [[west, south], [east, north]] – extent of all FPE sites; used before pins load
  bounds: [
    [117, 4.5],
    [127.5, 21],
  ],
  minZoom: 3, // low enough that fitBounds isn't clamped in short iframes
  maxBounds: [
    [112, 2],
    [132, 24],
  ],
  maxZoom: 14,
};

export const status = [
  { key: 'ongoing', label: 'Ongoing', color: '#118391' },
  { key: 'new', label: 'New', color: '#7f9c1c' },
  { key: 'closed', label: 'Closed', color: '#05454e' },
  { key: 'planned', label: 'To be opened', color: '#b3e218' },
];
export const statusColor = (key) =>
  status.find((s) => s.key === key)?.color ?? '#118391';

export const statusLabel = (key) =>
  status.find((s) => s.key === key)?.label ?? key;

// What kind of place a site is. Used for filter + chips.
export const themeOptions = [
  { key: 'forest', label: 'Forest & mountain' },
  { key: 'watershed', label: 'Watershed' },
  { key: 'coastal', label: 'Coastal & marine' },
  { key: 'wetland', label: 'Wetland & lake' },
  { key: 'island', label: 'Island ecosystem' },
  { key: 'ip', label: 'Indigenous peoples' },
];
export const themeLabel = (key) =>
  themeOptions.find((t) => t.key === key)?.label ?? key;

export const sortOptions = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'status', label: 'Status' },
  { key: 'newest', label: 'Recently added' },
];

export const LOCAL_STORAGE_KEY = 'fpe-priority-sites-demo';
export const PAGE_SIZE = 10;
