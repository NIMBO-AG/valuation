// src/api.js
function fetchQuestions() {
  return fetch(QUESTIONS_URL).then(res => res.json());
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
