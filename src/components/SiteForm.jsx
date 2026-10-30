import { useMemo, useState } from 'react';
import { themeOptions } from '../config';
import { safeUrl } from '../utilities';

const initial = {
  name: '',
  regionPcode: '',
  provincePcode: '',
  lguPcode: '',
  themes: [],
  summary: '',
  url: '',
};

export default function SiteForm({ regions, onPreview, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const provinces = useMemo(
    () => regions.find((r) => r.pcode === form.regionPcode)?.provinces ?? [],
    [regions, form.regionPcode],
  );
  const lgus = useMemo(
    () => provinces.find((p) => p.pcode === form.provincePcode)?.lgus ?? [],
    [provinces, form.provincePcode],
  );

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Each level resets everything below it (cascading dropdowns)
  function changeRegion(regionPcode) {
    set({ regionPcode, provincePcode: '', lguPcode: '' });
    onPreview(null);
  }
  function changeProvince(provincePcode) {
    set({ provincePcode, lguPcode: '' });
    onPreview(null);
  }
  function changeLgu(lguPcode) {
    set({ lguPcode });
    onPreview(lguPcode || null);
  }
  function toggleTheme(key) {
    set({
      themes: form.themes.includes(key)
        ? form.themes.filter((k) => k !== key)
        : [...form.themes, key],
    });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter the site name.';
    if (!form.regionPcode) e.regionPcode = 'Choose a region.';
    if (!form.provincePcode) e.provincePcode = 'Choose a province.';
    if (!form.lguPcode) e.lguPcode = 'Choose a city or municipality.';
    if (!form.summary.trim()) e.summary = 'Add a short description.';
    if (form.url.trim() && !safeUrl(form.url.trim()))
      e.url = 'Enter a full link starting with https://';
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      name: form.name.trim(),
      lguPcodes: [form.lguPcode],
      themes: form.themes,
      summary: form.summary.trim(),
      url: form.url.trim() ? safeUrl(form.url.trim()) : '',
    });
    setForm(initial);
    setErrors({});
  }

  const err = (k) =>
    errors[k] && (
      <p className="fpe-error" role="alert">
        {errors[k]}
      </p>
    );

  return (
    <form className="fpe-form" onSubmit={handleSubmit} noValidate>
      <p className="fpe-note">
        <strong>Demo form.</strong> Entries added here appear on the map for you
        only and stay in this browser. They are not sent to FPE.
      </p>

      <div className="fpe-field">
        <label htmlFor="fpe-name">Site name</label>
        <input
          id="fpe-name"
          type="text"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        {err('name')}
      </div>

      <p className="fpe-hint">Location</p>

      <div className="fpe-field">
        <label htmlFor="fpe-region">Region</label>
        <select
          id="fpe-region"
          value={form.regionPcode}
          onChange={(e) => changeRegion(e.target.value)}
        >
          <option value="">Select region…</option>
          {regions.map((r) => (
            <option key={r.pcode} value={r.pcode}>
              {r.name}
            </option>
          ))}
        </select>
        {err('regionPcode')}
      </div>

      <div className="fpe-field">
        <label htmlFor="fpe-province">Province</label>
        <select
          id="fpe-province"
          value={form.provincePcode}
          onChange={(e) => changeProvince(e.target.value)}
          disabled={!form.regionPcode}
        >
          <option value="">Select province…</option>
          {provinces.map((p) => (
            <option key={p.pcode} value={p.pcode}>
              {p.name}
            </option>
          ))}
        </select>
        {err('provincePcode')}
      </div>

      <div className="fpe-field">
        <label htmlFor="fpe-lgu">City / municipality</label>
        <select
          id="fpe-lgu"
          value={form.lguPcode}
          onChange={(e) => changeLgu(e.target.value)}
          disabled={!form.provincePcode}
        >
          <option value="">Select city or municipality…</option>
          {lgus.map((l) => (
            <option key={l.pcode} value={l.pcode}>
              {l.name}
            </option>
          ))}
        </select>
        {err('lguPcode')}
      </div>

      <fieldset className="fpe-field">
        <legend>
          Habitat type <span className="fpe-muted">(optional)</span>
        </legend>
        {themeOptions.map((t) => (
          <label key={t.key} className="fpe-check">
            <input
              type="checkbox"
              checked={form.themes.includes(t.key)}
              onChange={() => toggleTheme(t.key)}
            />
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="fpe-field">
        <label htmlFor="fpe-summary">About the site</label>
        <textarea
          id="fpe-summary"
          rows={5}
          value={form.summary}
          onChange={(e) => set({ summary: e.target.value })}
        />
        {err('summary')}
      </div>

      <div className="fpe-field">
        <label htmlFor="fpe-url">
          Link <span className="fpe-muted">(optional)</span>
        </label>
        <input
          id="fpe-url"
          type="text"
          inputMode="url"
          placeholder="https://"
          value={form.url}
          onChange={(e) => set({ url: e.target.value })}
        />
        {err('url')}
      </div>

      <div className="fpe-actions">
        <button type="submit" className="fpe-btn fpe-btn--accent">
          Add to map
        </button>
        <button
          type="button"
          className="fpe-btn"
          onClick={() => {
            onPreview(null);
            onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
