// src/FinanceInput.js

(function() {
  const { useState } = React;

  function FinanceInput({ answers, setAnswers }) {
    const e = React.createElement;
    const years = [2023, 2024, 2025];

    // 1) Year selector
    const selectedYears = Array.isArray(answers['Finance Years'])
      ? answers['Finance Years']
      : years;
    function toggleYear(year) {
      const next = selectedYears.includes(year)
        ? selectedYears.filter(y => y !== year)
        : [...selectedYears, year];
      setAnswers({ ...answers, 'Finance Years': next });
    }

    // 2) parse/format helpers
    function parseNum(val) {
      const s = (val == null ? '' : String(val))
        .replace(/\./g, '')
        .replace(',', '.');
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }
    function formatNum(val) {
      const n = parseNum(val);
      if ((val == null || val === '') && n === 0) return '';
      return n.toLocaleString('de-CH');
    }

    // 3) completion checks
    const revComplete = selectedYears.every(y =>
      parseNum(answers[`Umsatz ${y}`]) > 0
    );
    const singleAnswer = answers['Einzelgeschäftsführung']; // 'Ja'|'Nein'
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

    // 4) computations
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

    // 5) explanations
    const explanations = {
      'Umsatz':                  'Jahresumsatz in CHF (ohne MwSt).',
      'Einzelgeschäftsführung':  'Wird Ihr Unternehmen von genau einer Person geführt? ' +
                                 'Wählen Sie „Nein“ bei mehreren GF/Partnern.',
      'CEO-Saläre':              'Summe aller GF-Löhne pro Jahr.',
      'Abschreibungen':          'Wertminderung auf Sach- und IMM-Vermögen.',
      'EBIT':                    'Ergebnis vor Zinsen & Steuern (nach GF-Löhnen).',
      'EBIT Anpassung':          'Korrekturen für einmalige/außerordentliche Effekte.'
    };

    // 6) accordion state
    const [openRow, setOpenRow] = useState(null);
    function toggleRow(key) {
      setOpenRow(openRow === key ? null : key);
    }

    // 7) render a data row + its expandable content
    function renderDataRow({ label, key, isInput, calcFn }) {
      // determine if inputs for this row should show
      const showInputs =
        key !== 'CEO-Saläre' ||
        (key === 'CEO-Saläre' && singleAnswer === 'Ja');

      const row = e('tr', { key, className: 'border-t' },
        // label + toggle
        e('td', { className: 'px-1 py-1 bg-gray-100 flex items-center' },
          e('button', {
            type: 'button',
            onClick: () => toggleRow(key),
            className: 'mr-1 select-none'
          }, openRow === key ? '▼' : '▶'),
          e('span', {}, label)
        ),
        // year cells
        ...years.map(y =>
          e('td', { key: y, className: 'px-1 py-1 text-center' },
            selectedYears.includes(y)
              ? (isInput && showInputs
                  ? e('input', {
                      type: 'text',
                      inputMode: 'numeric',
                      className: 'w-full border rounded px-1 text-right',
                      value: formatNum(answers[`${key} ${y}`]),
                      onFocus: () => { if (openRow !== key) toggleRow(key); },
                      onChange: ev => {
                        const raw = ev.target.value
                          .replace(/[^0-9\.,\-]/g, '')
                          .replace(/(\..*?)\./g, '$1')
                          .replace(/(,.*?)\,/g, '$1');
                        setAnswers({ ...answers, [`${key} ${y}`]: raw });
                      },
                      onKeyDown: ev => { if (ev.key === 'Enter') ev.preventDefault(); }
                    })
                  : (!isInput
                      ? e('span', {}, calcFn(y))
                      : null)
                )
              : null
          )
        )
      );

      // build expandable content
      const contents = [];
      // row-specific explanation
      if (explanations[key]) {
        contents.push(
          e('p', { key: 'exp-text', className: 'mb-1 text-sm text-gray-600' },
            explanations[key]
          )
        );
      }
      // if CEO-Saläre row and revenue done, always show single-GF question here
      if (key === 'CEO-Saläre' && revComplete) {
        contents.push(
          e('div', { key: 'q-single', className: 'space-y-1' },
            ['Ja','Nein'].map(opt =>
              e('label', { key: opt, className: 'flex items-center space-x-1' },
                e('input', {
                  type: 'radio',
                  name: 'Einzelgeschäftsführung',
                  value: opt,
                  checked: singleAnswer === opt,
                  onChange: () =>
                    setAnswers({ ...answers, 'Einzelgeschäftsführung': opt })
                }),
                e('span', {}, opt)
              )
            )
          )
        );
      }

      const exp = openRow === key && contents.length
        ? e('tr', { key: key + '-exp' },
            e('td', {
              colSpan: years.length + 1,
              className: 'bg-gray-50 px-1 py-1'
            },
              ...contents
            )
          )
        : null;

      return [row, exp].filter(Boolean);
    }

    // 8) assemble wizard rows
    const rows = [];

    // always: Umsatz
    rows.push(...renderDataRow({ label: 'Umsatz', key: 'Umsatz', isInput: true }));

    // then CEO-Saläre row once revenue done
    if (revComplete) {
      rows.push(
        ...renderDataRow({ label: 'CEO-Saläre', key: 'CEO-Saläre', isInput: true })
      );
    }

    // Abschreibungen after CEO-Saläre question answered
    if (revComplete && singleAnswer) {
      rows.push(
        ...renderDataRow({ label: 'Abschreibungen', key: 'Abschreibungen', isInput: true })
      );
    }

    // EBIT
    if (revComplete && singleAnswer && salaryComplete && depComplete) {
      rows.push(...renderDataRow({ label: 'EBIT', key: 'EBIT', isInput: true }));
    }

    // EBIT-Marge
    if (revComplete && singleAnswer && salaryComplete && depComplete && ebitComplete) {
      rows.push(...renderDataRow({
        label: 'EBIT-Marge', key: 'EBIT-Marge', isInput: false, calcFn: calcEBITMargin
      }));
    }

    // EBIT Anpassung
    if (revComplete && singleAnswer && salaryComplete && depComplete && ebitComplete) {
      rows.push(...renderDataRow({
        label: 'EBIT Anpassung', key: 'EBIT Anpassung', isInput: true
      }));
    }

    // Angepasstes EBIT & EBITC
    if (revComplete && singleAnswer && salaryComplete && depComplete && ebitComplete && adjComplete) {
      rows.push(
        ...renderDataRow({
          label: 'EBIT angepasst', key: 'EBIT angepasst', isInput: false, calcFn: calcAdjustedEBIT
        }),
        ...renderDataRow({
          label: 'EBITC (EBIT+CEO)', key: 'EBITC', isInput: false, calcFn: calcEBITC
        })
      );
    }

    // 9) render
    return e('div', { className: 'space-y-4' },
      e('div', { className: 'flex gap-2' },
        years.map(y =>
          e('label', { key: y, className: 'flex items-center space-x-1' },
            e('input', {
              type: 'checkbox',
              checked: selectedYears.includes(y),
              onChange: () => toggleYear(y)
            }),
            e('span', {}, y)
          )
        )
      ),

      e('table', { className: 'w-full table-fixed border-collapse text-sm' },
        e('thead', {}, 
          e('tr', {},
            e('th', { className: 'px-1 py-1 bg-gray-200 text-left' }, 'Posten'),
            ...years.map(y =>
              e('th', { key: y, className: 'px-1 py-1 bg-gray-200 text-center' }, y)
            )
          )
        ),
        e('tbody', {}, ...rows)
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
