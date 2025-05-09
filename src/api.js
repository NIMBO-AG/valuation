// src/api.js

// Endpunkte aus config.js
// const BLOCKS_URL      = YOUR_BLOCKS_URL;
// const TRANSLATIONS_URL= YOUR_TRANSLATIONS_URL;
// const PREFILL_URL     = YOUR_PREFILL_URL;
// const WEBHOOK_URL     = YOUR_WEBHOOK_URL;
// const SCRIPT_URL      = YOUR_APPSCRIPT_URL;

function fetchBlocks() {
  return fetch(BLOCKS_URL).then(res => res.json());
}

function fetchTranslationsCached() {
  return loadTranslations(); // Caching-Logik in translations.js
}

function fetchPrefill(uid, callback) {
  loadPrefill(uid, callback); // Prefill-Logik in prefill.js
}

function postAnswers(payload, callback) {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).finally(callback);
}

let _cacheIndustries = null;
function fetchIndustriesCached() {
  if (_cacheIndustries) return Promise.resolve(_cacheIndustries);
  return fetch(`${SCRIPT_URL}?industries=true`)
    .then(res => res.json())
    .then(data => {
      _cacheIndustries = data;
      return data;
    });
}

// Globale Registrierung
window.fetchBlocks                = fetchBlocks;
window.fetchTranslationsCached    = fetchTranslationsCached;
window.fetchPrefill               = fetchPrefill;
window.postAnswers                = postAnswers;
window.fetchIndustriesCached      = fetchIndustriesCached;
