// src/api.js
function fetchQuestions() {
  return fetch(QUESTIONS_URL).then(r => r.json());
}

function fetchTranslationsCached() {
  return loadTranslations(); // uses localStorage cache from translations.js
}

// JSONP prefill
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
