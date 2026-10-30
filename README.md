# FPE Priority Conservation Sites – map

Refactor of the Bawal Plastikan map into a directory of the Foundation for the
Philippine Environment's (FPE) priority conservation sites.

- **MapLibre GL** map (OpenFreeMap "positron" basemap, no API key), FPE palette scoped under `.fpe`
- One pin per site, coloured by island group (Luzon / Visayas / Mindanao)
- Click a pin → popup **and** side panel (photo, habitat tags, write-up, region/provinces/LGUs, link to fpe.ph)
- The site's city/municipality polygons are outlined on the map and the view fits to them
- Search + island-group / habitat filters + sort + "only list sites shown on the map"
- **Demo form** ("Add a site (demo)"): Region → Province → City/Municipality dropdowns from the LGU geojson;
  entries live in `localStorage` only and can be cleared from the list

## Run / build

```bash
npm install
npm run dev        # demo page at http://localhost:5173
npm run build      # -> dist/fpe-sites-map.js, .css, data/
```

## Data

- `public/data/lgu.geojson` – city/municipality polygons (made with `npm run prepare-data` from `data-src/`)
- `public/data/sites.json` – the directory. One object per site:

```json
{
  "id": "cebu",
  "name": "Cebu",
  "locationText": "Cebu",
  "status": "ongoing",
  "themes": ["forest", "watershed"],
  "lguPcodes": ["PH0702222", "PH0702202"],
  "provincePcodes": [],
  "center": [123.17, 10.66],
  "image": "https://fpe.ph/uploads/…jpg",
  "url": "https://fpe.ph/conservation_site/location_details/cebu",
  "summary": "…"
}
```

- Give each site `lguPcodes` (specific cities/municipalities) and/or `provincePcodes` (whole provinces).
  Every listed LGU is outlined; the pin sits at the mean of the `lguPcodes` centroids, or the
  bounding-box centre for province-only sites. `center` ([lng, lat]) overrides the pin.
- `themes`: `forest`, `watershed`, `coastal`, `wetland`, `island`, `ip`. Island group is derived from the region.
- `image` may be `null`; `summary` may be empty (the panel says a write-up isn't available).

## Embedding in WordPress

Upload `dist/fpe-sites-map.js`, `dist/fpe-sites-map.css` and `dist/data/` to one folder, then in a Custom HTML block:

```html
<link rel="stylesheet" href="/wp-content/uploads/fpe-map/fpe-sites-map.css" />
<div data-fpe-sites-map data-height="720px"></div>
<script src="/wp-content/uploads/fpe-map/fpe-sites-map.js"></script>
```

Optional attributes: `data-data-base`, `data-sites-url`, `data-style-url`, `data-height`.
Or call `FPESitesMap.mount(element, options)`. Thumbnails are loaded directly from fpe.ph.
