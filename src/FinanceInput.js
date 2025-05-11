// src/FinanceInput.js

(function() {
  const { useState } = React;

  function FinanceInput({ answers, setAnswers }) {
    const e = React.createElement;
    const years = [2023, 2024, 2025];

    // ─────────────────────────────────────────────────────────────────────────
    // 1) Year selector
    // ─────────────────────────────────────────────────────────────────────────
    const selectedYears = Array.isArray(answers['Finance Years'])
      ? answers['Finance Years']
      : years;

    function toggleYear(year) {
      const next = selectedYears.includes(year)
        ? selectedYears.filter(y => y !== year)
        : [...selectedYears, year];
      setAnswers({ ...answers, 'Finance Years': next });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2) Parse & format helpers
    // ─────────────────────────────────────────────────────────────────────────
    function parseNum(val) {
      const s = (val == null ? '' : String(val))
        .replace(/\./g, '')    // drop thousands dots
        .replace(',', '.');    // comma → decimal
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }
    function formatNum(val) {
      const n = parseNum(val);
      if ((val == null || val === '') && n === 0) return '';
      return n.toLocaleString('de-CH');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3) Completion checks for each wizard step
    // ─────────────────────────────────────────────────────────────────────────
    const revComplete = selectedYears.every(y =>
      parseNum(answers[`Umsatz ${y}`]) > 0
    );
    const singleAnswer = answers['Einzelgeschäftsführung']; // 'Ja' or 'Nein'
    const salaryComplete = singleAnswer === 'Nein'
      || selectedYears.every(y =>
          parseNum(answers[`CEO-Saläre ${y}`]) > 0
        );
    const depComplete = selectedYears.every(y =>
      parseNum(answers[`Abschreibungen ${y}`]) > 0
    );
    const ebitComplete = selectedYears.every(y =>
      parseNum(answers[`EBIT ${y}`]) > 0
    );
    const adjComplete = selectedYears.every(y =>
      answers[`EBIT Anpassung ${y}`] != null
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 4) Computation functions
    // ─────────────────────────────────────────────────────────────────────────
    function calcEBITMargin(y) {
      const rev  = parseNum(answers[`Umsatz ${y}`]);
      const ebit = parseNum(answers[`EBIT ${y}`]);
      return rev > 0
        ? Math.round((ebit / rev) * 100) + '%'
        : '';
    }
    function calcAdjustedEBIT(y) {
      const ebit = parseNum(answers[`EBIT ${y}`]);
      const adj  = parseNum(answers[`EBIT Anpassung ${y}`]);
      return formatNum(ebit + adj);
    }
    function calcEBITC(y) {
      const adj = parseNum(calcAdjustedEBIT(y));
      const ceo = parseNum(answers[`CEO-Saläre ${y}`]);
      return formatNum(adj + ceo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5) Explanations text
    // ─────────────────────────────────────────────────────────────────────────
    const explanations = {
      'Umsatz':         'Geben Sie Ihren Jahresumsatz (ohne MwSt) in CHF an.',
      'Einzelgeschäftsführung':
                        'Ist Ihr Unternehmen von einer Einzelperson geführt? ' +
                        '„Nein“ wählen bei mehreren Geschäftsführern/Partnern.',
      'CEO-Saläre':     'Summe aller ausgezahlten Löhne der Geschäftsführung.',
      'Abschreibungen': 'Jährliche Wertminderung auf Sach- und IMM-Vermögen.',
      'EBIT':           'Ergebnis vor Zinsen & Steuern (nach GF-Löhnen).',
      'EBIT Anpassung': 'Korrekturen für einmalige/außerordentliche Effekte.'
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 6) Accordion‐toggle state for explanations
    // ─────────────────────────────────────────────────────────────────────────
    const [openRow, setOpenRow] = useState(null);
    function toggleRow(key) {
      setOpenRow(openRow === key ? null : key);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7) Render one data row + its explanation
    // ─────────────────────────────────────────────────────────────────────────
    function renderDataRow({ label, key, isInput, calcFn }) {
      // main row
      const row = e('tr', { key: key, className: 'border-t' },
        // label + accordion toggle
        e('td', { className: 'px-2 py-1 bg-gray-100 flex items-center' },
          e('button', {
            type: 'button',
            onClick: () => toggleRow(key),
            className: 'mr-2 select-none'
          }, openRow === key ? '▼' : '▶'),
          e('span', {}, label)
        ),
        // year cells
        ...years.map(y =>
          e('td', { key: y, className: 'px-2 py-1 text-center' },
            selectedYears.includes(y)
              ? (isInput
                  ? e('input', {
                      type: 'text',
                      inputMode: 'numeric',
                      className: 'w-24 border rounded px-1 text-right',
                      value: formatNum(answers[`${key} ${y}`]),
                      onFocus: () => { if (openRow !== key) toggleRow(key); },
                      onChange: ev =>
                        setAnswers({
                          ...answers,
                          [`${key} ${y}`]: ev.target.value
                            .replace(/[^0-9\.,\-]/g, '')
                            .replace(/(\..*?)\./g, '$1')
                            .replace(/(,.*?)\,/g, '$1')
                        }),
                      onKeyDown: ev => { if (ev.key === 'Enter') ev.preventDefault(); }
                    })
                  : e('span', {}, calcFn(y))
                )
              : null
          )
        )
      );

      // explanation row, only if this row is currently open
      const exp = (openRow === key && explanations[key])
        ? e('tr', { key: key + '-exp' },
            e('td', {
              colSpan: years.length + 1,
              className: 'bg-gray-50 px-3 py-1 text-sm text-gray-600 italic'
            }, explanations[key])
          )
        : null;

      return [row, exp].filter(Boolean);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8) Assemble wizard‐style display
    // ─────────────────────────────────────────────────────────────────────────
    const rows = [];

    // Always show revenue row
    rows.push(...renderDataRow({ label: 'Umsatz', key: 'Umsatz', isInput: true }));

    // Step 2: single‐GF question
    if (revComplete && !singleAnswer) {
      rows.push(
        e('tr', { key: 'q-single', className: 'border-t' },
          e('td', {
            colSpan: years.length + 1,
            className: 'px-2 py-4 bg-blue-50'
          },
            e('label', { className: 'block font-medium mb-1' },
              'Gibt es genau eine Person, die Ihr Unternehmen als Geschäftsführer/in führt?'
            ),
            e('p', { className: 'text-sm text-gray-600 mb-2 italic' },
              explanations['Einzelgeschäftsführung']
            ),
            ['Ja','Nein'].map(opt =>
              e('label', { key: opt, className:'flex items-center mb-1' },
                e('input', {
                  type: 'radio',
                  name: 'Einzelgeschäftsführung',
                  value: opt,
                  checked: singleAnswer === opt,
                  onChange: () =>
                    setAnswers({ ...answers, 'Einzelgeschäftsführung': opt }),
                  className: 'mr-2'
                }),
                opt
              )
            )
          )
        )
      );
    }

    // Step 3: CEO‐Salaries row (only if singleAnswer chosen)
    if (singleAnswer) {
      // if user said “Nein”, we skip the CEO‐Salaries inputs entirely
      if (singleAnswer === 'Ja') {
        rows.push(
          ...renderDataRow({ label: 'CEO-Saläre', key: 'CEO-Saläre', isInput: true })
        );
      }
    }

    // Step 4: Abschreibungen
    if (singleAnswer && salaryComplete) {
      rows.push(
        ...renderDataRow({ label: 'Abschreibungen', key: 'Abschreibungen', isInput: true })
      );
    }

    // Step 5: EBIT
    if (singleAnswer && salaryComplete && depComplete) {
      rows.push(
        ...renderDataRow({ label: 'EBIT', key: 'EBIT', isInput: true })
      );
    }

    // Step 6: EBIT‐Margin computed
    if (singleAnswer && salaryComplete && depComplete && ebitComplete) {
      rows.push(
        ...renderDataRow({ label: 'EBIT-Marge', key: 'EBIT-Marge', isInput: false, calcFn: calcEBITMargin })
      );
    }

    // Step 7: EBIT‐Anpassung
    if (singleAnswer && salaryComplete && depComplete && ebitComplete) {
      rows.push(
        ...renderDataRow({ label: 'EBIT Anpassung', key: 'EBIT Anpassung', isInput: true })
      );
    }

    // Step 8: Angepasstes EBIT & EBITC summary
    if (singleAnswer && salaryComplete && depComplete && ebitComplete && adjComplete) {
      rows.push(
        ...renderDataRow({ label: 'EBIT angepasst', key: 'EBIT angepasst', isInput: false, calcFn: calcAdjustedEBIT }),
        ...renderDataRow({ label: 'EBITC (EBIT+CEO)', key: 'EBITC', isInput: false, calcFn: calcEBITC })
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9) Render
    // ─────────────────────────────────────────────────────────────────────────
    return e('div', { className: 'space-y-4' },
      // year selectors
      e('div', { className: 'flex gap-4' },
        years.map(y =>
          e('label', { key: y, className:'flex items-center space-x-1' },
            e('input', {
              type: 'checkbox',
              checked: selectedYears.includes(y),
              onChange: () => toggleYear(y)
            }),
            e('span', {}, y)
          )
        )
      ),

      // wizard table
      e('table', { className:'w-full table-auto border-collapse text-sm' },
        e('thead', {},
          e('tr', {},
            e('th',{ className:'px-2 py-1 bg-gray-200 text-left' }, 'Posten'),
            ...years.map(y =>
              e('th',{ key:y, className:'px-2 py-1 bg-gray-200 text-center' }, y)
            )
          )
        ),
        e('tbody', {}, ...rows)
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
