import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  DEFAULT_STYLE_URL,
  mapDefaults,
  statusColor,
  statusLabel,
  themeLabel,
} from '../config';
import { siteLocation } from '../utilities';

const EMPTY = { type: 'FeatureCollection', features: [] };
const PIN_SVG =
  '<svg viewBox="0 0 28 38" width="28" height="38" aria-hidden="true">' +
  '<path d="M14 1C6.8 1 1 6.8 1 13.9 1 23.6 14 37 14 37s13-13.4 13-23.1C27 6.8 21.2 1 14 1z" fill="var(--pin)" stroke="#fff" stroke-width="2"/>' +
  '<circle cx="14" cy="14" r="4.5" fill="#fff"/></svg>';

const asCollection = (features) =>
  features && features.length ? { type: 'FeatureCollection', features } : EMPTY;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text; // textContent: user text is never parsed as HTML
  return node;
}

function popupContent(site, onOpen) {
  const root = el('div', 'fpe-popup');
  root.appendChild(el('div', 'fpe-popup__title', site.name));
  root.appendChild(el('div', 'fpe-popup__sub', siteLocation(site)));

  const meta = el('div', 'fpe-popup__meta');
  const tag = el('span', 'fpe-tag', statusLabel(site.status));
  tag.style.setProperty('--tag', statusColor(site.status));
  meta.appendChild(tag);
  (site.themes ?? [])
    .slice(0, 2)
    .forEach((t) => meta.appendChild(el('span', null, themeLabel(t))));
  root.appendChild(meta);

  if (site.summary) {
    const text =
      site.summary.length > 150
        ? `${site.summary.slice(0, 150).trim()}…`
        : site.summary;
    root.appendChild(el('p', 'fpe-popup__text', text));
  }
  const btn = el('button', 'fpe-link', 'Read full details in the side panel →');
  btn.type = 'button';
  btn.addEventListener('click', onOpen);
  root.appendChild(btn);
  return root;
}

export default function MapView({
  pins,
  selectedId,
  onSelect,
  onOpenPanel,
  onBoundsChange,
  highlight,
  focus,
  styleUrl,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const markersRef = useRef(new Map());
  const popupRef = useRef(null);
  const highlightRef = useRef(highlight);
  const callbacks = useRef({});
  callbacks.current = { onSelect, onOpenPanel, onBoundsChange };
  highlightRef.current = highlight;

  // --- create the map once -------------------------------------------------
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl || DEFAULT_STYLE_URL,
      center: mapDefaults.center,
      zoom: mapDefaults.zoom,
      minZoom: mapDefaults.minZoom,
      maxBounds: mapDefaults.maxBounds,
      maxZoom: mapDefaults.maxZoom,
      attributionControl: { compact: true },
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    );

    map.on('load', () => {
      map.addSource('lgu-highlight', { type: 'geojson', data: EMPTY });
      map.addLayer({
        id: 'lgu-fill',
        type: 'fill',
        source: 'lgu-highlight',
        paint: { 'fill-color': '#118391', 'fill-opacity': 0.22 },
      });
      map.addLayer({
        id: 'lgu-line',
        type: 'line',
        source: 'lgu-highlight',
        paint: { 'line-color': '#05454e', 'line-width': 1.6 },
      });
      readyRef.current = true;
      map
        .getSource('lgu-highlight')
        .setData(asCollection(highlightRef.current));
      callbacks.current.onBoundsChange(map.getBounds());
    });
    map.on('moveend', () => callbacks.current.onBoundsChange(map.getBounds()));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- pins ----------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const m of markersRef.current.values()) m.marker.remove();
    markersRef.current.clear();

    for (const pin of pins) {
      // MapLibre positions the outer element with an inline transform, so the
      // hover/selected scale and transition live on the inner button instead.
      const holder = el('div', 'fpe-pin-holder');
      const node = el('button', 'fpe-pin');
      node.type = 'button';
      node.style.setProperty('--pin', statusColor(pin.status));
      node.setAttribute('aria-label', pin.name);
      node.innerHTML = PIN_SVG; // static markup, no user content
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        callbacks.current.onSelect(pin.id);
      });
      holder.appendChild(node);
      const marker = new maplibregl.Marker({
        element: holder,
        anchor: 'bottom',
      })
        .setLngLat(pin.lngLat)
        .addTo(map);
      markersRef.current.set(pin.id, { marker, node, pin });
    }
  }, [pins]);

  // --- selected pin: style, popup, fit to the site's area ---------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const [id, m] of markersRef.current) {
      m.node.classList.toggle('is-selected', id === selectedId);
    }
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    const entry = selectedId && markersRef.current.get(selectedId);
    if (!entry) return;

    const popup = new maplibregl.Popup({
      offset: [0, -34],
      maxWidth: '300px',
      className: 'fpe-popup-wrap',
    })
      .setLngLat(entry.pin.lngLat)
      .setDOMContent(
        popupContent(entry.pin, () => callbacks.current.onOpenPanel()),
      )
      .addTo(map);
    popup.on('close', () => {
      if (popupRef.current === popup) {
        popupRef.current = null;
        callbacks.current.onSelect(null);
      }
    });
    popupRef.current = popup;
    map.fitBounds(entry.pin.bbox, {
      padding: { top: 140, bottom: 60, left: 50, right: 50 },
      maxZoom: 9.5,
      duration: 800,
    });
  }, [selectedId, pins]);

  // --- highlighted city/municipality outlines ---------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.getSource('lgu-highlight')?.setData(asCollection(highlight));
  }, [highlight]);

  // --- fit to a bbox when asked (e.g. picking a city in the form) -----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus?.bbox) return;
    map.fitBounds(focus.bbox, {
      padding: { top: 60, bottom: 60, left: 40, right: 40 },
      maxZoom: 11,
      duration: 900,
    });
  }, [focus]);

  return <div className="fpe-map" ref={containerRef} />;
}
