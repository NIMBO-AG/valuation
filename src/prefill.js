// src/prefill.js
function loadPrefill(uid, callback) {
  window.handlePrefill = callback;
  const tag = document.createElement('script');
  tag.src = `${WEBHOOK_URL}?uid=${uid}&callback=handlePrefill`;
  document.body.appendChild(tag);
}