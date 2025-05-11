// src/FinanceInput.js

function FinanceInput({ answers, setAnswers }) {
  const e = React.createElement;
  const years = [2023, 2024, 2025];

  // 1. 初始化: Finance Years auf alle drei setzen
  React.useEffect(() => {
    if (!Array.isArray(answers['Finance Years'])) {
      setAnswers({ ...answers, 'Finance Years': [...years] });
    }
  }, []);

  const selectedYears = answers['Finance Years'] || [];

  // 2. State: aktuell aufgeklappter Posten
  const [openRow, setOpenRow] = React.useState('Umsatz');

  // 3. Helfer: parse & format deutsch
  function parseNum(val) {
    if (typeof val !== 'string') return null;
    const cleaned = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '');
    const f = parseFloat(cleaned);
    return isNaN(f) ? null : f;
  }
  function formatNum(val) {
    const n = parseNum(val);
    return n === null ? '' : n.toLocaleString('de-CH');
  }

  // 4. Completion‐Flags
  const revComplete = selectedYears.every(y => parseNum(answers[`Umsatz ${y}`]) !== null);
  const ceoComplete = revComplete && selectedYears.every(y => parseNum(answers[`CEO-Saläre ${y}`]) !== null);
  const absComplete = ceoComplete && selectedYears.every(y => parseNum(answers[`Abschreibungen ${y}`]) !== null);
  const ebitComplete = absComplete && selectedYears.every(y => parseNum(answers[`EBIT ${y}`]) !== null);

  // 5. Einzelgeschäftsführung–Antwort (default “Ja”)
  const single = answers['Einzelgeschäftsführung'] || 'Ja';

  // 6. Umschalter & Feld‐Setter
  function toggleRow(key) {
    setOpenRow(openRow === key ? null : key);
  }
  function setYearField(key, y, raw) {
    // EBIT darf niemals > Umsatz sein
    if (key === 'EBIT') {
      const rev = parseNum(answers[`Umsatz ${y}`]);
      const val = parseNum(raw);
      if (rev !== null && val !== null && val > rev) raw = rev.toString();
    }
    setAnswers({ ...answers, [`${key} ${y}`]: raw });
  }
  function setSingle(ans) {
    setAnswers({ ...answers, 'Einzelgeschäftsführung': ans });
  }

  // 7. Calc‐Funktionen
  function calcEBITMargin(y) {
    const rev = parseNum(answers[`Umsatz ${y}`]);
    const ebt = parseNum(answers[`EBIT ${y}`]);
    return rev && ebt !== null ? Math.round((ebt / rev) * 100) + '%' : '';
  }
  function calcAdjEBIT(y) {
    const ebt = parseNum(answers[`EBIT ${y}`]) || 0;
    const adj = parseNum(answers[`EBIT Anpassung ${y}`]) || 0;
    return ebt + adj;
  }
  function calcEBITC(y) {
    const ceo = parseNum(answers[`CEO-Saläre ${y}`]) || 0;
    return formatNum((calcAdjEBIT(y) + ceo).toString());
  }

  // 8. Definition aller Reihen, plus Voraussetzungs‐Filter
  const allRows = [
    { label: 'Umsatz',            key: 'Umsatz',          input: true,  show: () => true },
    { label: 'CEO-Saläre',        key: 'CEO-Saläre',      input: true,  show: () => revComplete },
    { label: 'Abschreibungen',    key: 'Abschreibungen',  input: true,  show: () => ceoComplete },
    { label: 'EBIT',              key: 'EBIT',            input: true,  show: () => absComplete },
    { label: 'EBIT-Marge',        key: 'EBIT-Marge',      input: false, calc: calcEBITMargin, show: () => ebitComplete },
    { label: 'EBIT Anpassung',    key: 'EBIT Anpassung',  input: true,  show: () => ebitComplete },
    { label: 'EBIT angepasst',    key: 'EBIT angepasst',  input: false, calc: calcAdjEBIT,   show: () => ebitComplete },
    { label: 'EBITC (EBIT+CEO)',  key: 'EBITC (EBIT+CEO)',input: false, calc: calcEBITC,      show: () => ebitComplete }
  ].filter(r => r.show());

  // 9. Renderer für eine Daten‐Reihe
  function renderRow(r) {
    const { label, key, input, calc } = r;
    const isOpen = openRow === key;

    // Haupt‐Zeile
    const mainRow = e('tr', { key },
      e('td', {
        className: 'bg-gray-100 px-2 py-1 align-top select-none'
      },
        e('button', {
          type: 'button',
          onClick: () => toggleRow(key),
          className: 'mr-1'
        }, isOpen ? '▼' : '▶'),
        e('span', { className: 'font-medium' }, label)
      ),
      years.map(y =>
        e('td', {
          key: y,
          className: 'px-1 py-1 text-right'
        },
          selectedYears.includes(y)
            ? (input
                ? e('input', {
                    type: 'text',
                    className: 'w-full border rounded px-1',
                    inputMode: 'numeric',
                    value: formatNum(answers[`${key} ${y}`]),
                    onKeyDown: ev => { if (ev.key==='Enter') ev.preventDefault(); },
                    onChange: ev => setYearField(key, y, ev.target.value),
                    onFocus: () => { if (!isOpen) toggleRow(key); }
                  })
                : e('span', {}, calc(y))
              )
            : null
        )
      )
    );

    // Zusatz‐Zeile für “Einzelgeschäftsführung” – **unter** CEO-Saläre
    if (key === 'CEO-Saläre' && isOpen && revComplete) {
      const colspan = years.length + 1;
      const qRow = e('tr', { key: key + '-single' },
        e('td', { colSpan: colspan, className: 'px-2 py-2 bg-gray-50' },
          e('p', { className: 'italic text-gray-700 mb-1' },
            'Wird Ihr Unternehmen von genau einer Person geführt?'
          ),
          ['Ja','Nein'].map(opt =>
            e('label', { key: opt, className: 'inline-flex items-center mr-4' },
              e('input', {
                type: 'radio',
                name: 'Einzelgeschäftsführung',
                value: opt,
                checked: single === opt,
                onChange: () => setSingle(opt)
              }),
              e('span', { className: 'ml-1' }, opt)
            )
          )
        )
      );
      return [ mainRow, qRow ];
    }

    return mainRow;
  }

  // 10. Render alles in einer schmalen Tabelle ohne horizontale Lücken
  return e('div', { className: 'overflow-x-auto' },
    e('table', { className: 'table-auto w-full text-sm border-collapse' },
      // Kopfzeile
      e('thead', {},
        e('tr', {},
          e('th', { className: 'bg-gray-200 px-2 py-1 text-left' }, 'Posten'),
          ...years.map(y =>
            e('th', { key: y, className: 'bg-gray-200 px-1 py-1' }, y)
          )
        )
      ),
      // Körper
      e('tbody', {},
        allRows.flatMap(r => renderRow(r))
      )
    )
  );
}

window.FinanceInput = FinanceInput;
