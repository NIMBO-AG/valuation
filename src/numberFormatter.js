// src/numberFormatter.js
function formatNumber(value) {
  if (value === null || value === undefined) return '';
  const raw = value.toString().replace(/,/g, '');
  if (raw === '') return '';
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function parseNumber(formatted) {
  return formatted.toString().replace(/,/g, '').replace(/[^0-9]/g, '');
}
