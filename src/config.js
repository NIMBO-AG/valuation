// src/config.js

// Base Apps Script URL
window.SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFEYW4nGPTRTmE2VGzZkSRRRvP-yc3RKhP4VOQdg9G5qatvwoMEiymVVGqJaZYQQE/exec";

// Endpoints
window.WEBHOOK_URL       = window.SCRIPT_URL;
window.BLOCKS_URL        = `${window.SCRIPT_URL}?blocks=true`;
window.TRANSLATIONS_URL  = `${window.SCRIPT_URL}?translations=true`;
window.PREFILL_URL       = window.SCRIPT_URL;  // doGet(e).uid is handled automatically
