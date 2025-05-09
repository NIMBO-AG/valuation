// src/api.js
function fetchBlocks() {
  return fetch(BLOCKS_URL).then(res => res.json());
}


function fetchTranslationsCached() {
  return loadTranslations(); // uses caching in translations.js
}

function fetchPrefill(uid, callback) {
  loadPrefill(uid, callback);
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
export function fetchIndustriesCached() {
  if (_cacheIndustries) return Promise.resolve(_cacheIndustries);
  return fetch(`${SCRIPT_URL}?industries=true`)
    .then(res => res.json())
    .then(data => {
      _cacheIndustries = data;
      return data;
    });
}
