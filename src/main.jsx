import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import './styles.css';

// When loaded with a plain <script src=".../fpe-sites-map.js">, data files are
// expected in a "data/" folder next to the script. Override with data-data-base.
const scriptBase = (() => {
  try {
    const s = document.currentScript;
    if (s && s.src) return s.src.replace(/[^/]*$/, '');
  } catch {
    /* ignore */
  }
  return '/';
})();

export function mount(el, options = {}) {
  const ds = el.dataset;
  const dataBase = options.dataBase ?? ds.dataBase ?? `${scriptBase}data/`;
  const height = options.height ?? ds.height ?? '720px';
  const sitesUrl = options.sitesUrl ?? ds.sitesUrl ?? `${dataBase}sites.json`;
  const styleUrl = options.styleUrl ?? ds.styleUrl;

  createRoot(el).render(
    <App dataBase={dataBase} height={height} sitesUrl={sitesUrl} styleUrl={styleUrl} />
  );
}

function autoMount() {
  document.querySelectorAll('[data-fpe-sites-map]').forEach((el) => {
    if (el.dataset.mounted) return;
    el.dataset.mounted = '1';
    mount(el);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoMount);
} else {
  autoMount();
}
