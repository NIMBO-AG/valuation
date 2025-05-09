// src/api.js

// Blocks-/Translation-/Prefill-/Webhook-URLs sollten in config.js stehen
// und dort als globale Variablen definiert werden, z.B.:
//   window.BLOCKS_URL = 'https://...';
//   window.TRANSLATIONS_URL = 'https://...';
//   window.PREFILL_URL = 'https://...';
//   window.WEBHOOK_URL = 'https://...';
//   window.SCRIPT_URL = 'https://script.google.com/.../exec';

function fetchBlocks() {
  return fetch(window.BLOCKS_URL).then(res => res.json());
}

function fetchTranslationsCached() {
  return loadTranslations(); // caching in translations.js
}

function fetchPrefill(uid, callback) {
  loadPrefill(uid, callback); // in prefill.js
}

function postAnswers(payload, callback) {
  fetch(window.WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).finally(callback);
}

let _cacheIndustries = null;
function fetchIndustriesCached() {
  const scriptUrl = window.SCRIPT_URL;
  if (!scriptUrl) {
    console.error('fetchIndustriesCached: window.SCRIPT_URL is not defined');
    return Promise.resolve([]);
  }
  if (_cacheIndustries) return Promise.resolve(_cacheIndustries);
  return fetch(`${scriptUrl}?industries=true`)
    .then(res => res.json())
    .then(data => {
      _cacheIndustries = data;
      return data;
    });
}

// Globale Registrierung
window.fetchBlocks             = fetchBlocks;
window.fetchTranslationsCached = fetchTranslationsCached;
window.fetchPrefill            = fetchPrefill;
window.postAnswers             = postAnswers;
window.fetchIndustriesCached   = fetchIndustriesCached;
