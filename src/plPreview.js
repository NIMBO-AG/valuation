// src/plPreview.js

(function setupPLPreviewUpdater() {
  const preview = document.querySelector('#pl-preview');
  const yearCols = [2023, 2024, 2025];
  const keys = ['Umsatz', 'EBIT', 'EBITDA', 'CEO-Saläre'];

  function setCell(rowKey, year, value) {
    const cell = document.querySelector(`[data-pl="${rowKey}-${year}"]`);
    if (cell) cell.textContent = value;
  }

  function updatePL(answers) {
    for (const key of keys) {
      for (const year of yearCols) {
        const answerKey = `${key} ${year}`;
        const val = answers[answerKey];
        if (val !== undefined) setCell(key, year, formatNumber(val));
      }
    }

    // EBIT-Marge berechnen
    for (const year of yearCols) {
      const rev = parseFloat(answers[`Umsatz ${year}`] || '');
      const ebit = parseFloat(answers[`EBIT ${year}`] || '');
      const cell = document.querySelector(`[data-pl="EBIT-Marge-${year}"]`);
      if (cell && rev > 0) {
        const pct = (ebit / rev) * 100;
        cell.textContent = pct.toFixed(1) + '%';
      } else if (cell) {
        cell.textContent = '';
      }
    }
  }

  function formatNumber(x) {
    if (x === '' || x === undefined || isNaN(x)) return '';
    return Number(x).toLocaleString('de-CH');
  }

  // Globale Methode zur Verwendung in FormComponent
  window.updatePLPreview = updatePL;
})();

// Vorschau-Layout (z. B. in index.html oder app.js ergänzen)
window.renderPLPreview = function() {
  return `
    <div id="pl-preview" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-2 overflow-x-auto text-sm hidden md:block">
      <table class="min-w-max table-auto border-collapse">
        <thead>
          <tr>
            <th class="text-left pr-4">Kennzahl</th>
            <th>2023</th>
            <th>2024</th>
            <th>2025</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="pr-4">Umsatz</td>
            <td data-pl="Umsatz-2023"></td>
            <td data-pl="Umsatz-2024"></td>
            <td data-pl="Umsatz-2025"></td>
          </tr>
          <tr>
            <td class="pr-4">EBIT</td>
            <td data-pl="EBIT-2023"></td>
            <td data-pl="EBIT-2024"></td>
            <td data-pl="EBIT-2025"></td>
          </tr>
          <tr>
            <td class="pr-4">EBIT-Marge</td>
            <td data-pl="EBIT-Marge-2023"></td>
            <td data-pl="EBIT-Marge-2024"></td>
            <td data-pl="EBIT-Marge-2025"></td>
          </tr>
          <tr>
            <td class="pr-4">EBITDA</td>
            <td data-pl="EBITDA-2023"></td>
            <td data-pl="EBITDA-2024"></td>
            <td data-pl="EBITDA-2025"></td>
          </tr>
          <tr>
            <td class="pr-4">CEO-Saläre</td>
            <td data-pl="CEO-Saläre-2023"></td>
            <td data-pl="CEO-Saläre-2024"></td>
            <td data-pl="CEO-Saläre-2025"></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
