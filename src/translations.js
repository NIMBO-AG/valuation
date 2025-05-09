// src/translations.js
async function loadTranslations() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('forceTrans') === 'true') {
    localStorage.removeItem('nimbo_trans');
    localStorage.removeItem('nimbo_trans_ts');
  }
  const cache = localStorage.getItem('nimbo_trans');
  const ts = parseInt(localStorage.getItem('nimbo_trans_ts') || '0', 10);
  if (cache && (Date.now() - ts < 3600_000)) {
    return JSON.parse(cache);
  }
  const res = await fetch(TRANSLATIONS_URL);
  const json = await res.json();
  localStorage.setItem('nimbo_trans', JSON.stringify(json));
  localStorage.setItem('nimbo_trans_ts', Date.now().toString());
  return json;
}
