// Free, keyless vector basemap (OpenFreeMap). Swap for MapTiler/Stadia/self-hosted if needed.
export const DEFAULT_STYLE_URL =
  'https://tiles.openfreemap.org/styles/positron';

export const mapDefaults = {
  center: [121.774017, 12.879721], // [lng, lat] – Philippines
  zoom: 4.8,
  minZoom: 4,
  // [[west, south], [east, north]] – keeps the Philippines in view, can't pan far away
  maxBounds: [
    [112, 2],
    [132, 24],
  ],
  maxZoom: 14,
};

// Island group is derived from the PSGC region code (see islandGroupOf in utilities.js)
export const islandGroups = [
  { key: 'luzon', label: 'Luzon', color: '#118391' },
  { key: 'visayas', label: 'Visayas', color: '#7f9c1c' },
  { key: 'mindanao', label: 'Mindanao', color: '#05454e' },
];
export const groupColor = (key) =>
  islandGroups.find((g) => g.key === key)?.color ?? '#118391';
export const groupLabel = (key) =>
  islandGroups.find((g) => g.key === key)?.label ?? key;

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
  { key: 'group', label: 'North to south' },
  { key: 'newest', label: 'Recently added' },
];

export const LOCAL_STORAGE_KEY = 'fpe-priority-sites-demo';
export const PAGE_SIZE = 10;
