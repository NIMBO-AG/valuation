// src/FinanceInput.js

function FinanceInput({ answers, setAnswers }) {
  const e = React.createElement;
  const years = [2023, 2024, 2025];

  // Initialize Finance Years to all if unset
  React.useEffect(() => {
    if (!Array.isArray(answers['Finance Years'])) {
      setAnswers({ ...answers, 'Finance Years': [...years] });
    }
  }, []);

  const selectedYears = answers['Finance Years'] || [];

  // State: which row is currently open
  const [openRow, setOpenRow] = React.useState('Umsatz');

  // Single‐GF answer from answers, default “Ja”
  const singleAnswer = answers['Einzelgeschäftsführung'] || 'Ja';

  // Has the Umsatz for all selected years been filled?
  const revComplete = selectedYears.every(
    y => typeof answers[`Umsatz ${y}`] === 'string' && answers[`Umsatz ${y}`].trim() !== ''
  );

  // Simple German‐style parse + format
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

  // Handlers
  function toggleYear(y) {
    const next = selectedYears.includes(y)
      ? selectedYears.filter(z => z !== y)
      : [...selectedYears, y];
    setAnswers({ ...answers, 'Finance Years': next });
  }
  function toggleRow(key) {
    setOpenRow(openRow === key ? null : key);
  }
  function setField(key, year, raw) {
    // Enforce EBIT ≤ Umsatz
    if (key === 'EBIT') {
      const rev = parseNum(answers[`Umsatz ${year}`]);
      const val = parseNum(raw);
      if (rev !== null && val !== null && val > rev) {
        raw = rev.toString(); // clamp to revenue
      }
    }
    setAnswers({
      ...answers,
      [`${key} ${year}`]: raw
    });
  }

  // Calculations
  function calcEBITMargin(year) {
    const rev = parseNum(answers[`Umsatz ${year}`]);
    const ebt = parseNum(answers[`EBIT ${year}`]);
    if (rev && ebt !== null) return Math.round((ebt / rev) * 100) + '%';
    return '';
  }
  function calcAdjustedEBIT(year) {
    const ebt = parseNum(answers[`EBIT ${year}`]) || 0;
    const adj = parseNum(answers[`EBIT Anpassung ${year}`]) || 0;
    return ebt + adj;
  }
  function calcEBITC(year) {
    const adj = calcAdjustedEBIT(year);
    const ceo = parseNum(answers[`CEO-Saläre ${year}`]) || 0;
    return formatNum((adj + ceo).toString());
  }

  // Explanations under each row
  const explanations = {
    Umsatz:          'Jahresumsatz in CHF (ohne MwSt.).',
    'CEO-Saläre':    'Tatsächliche Personalkosten des/der Geschäftsführer(s).',
    Abschreibungen:  'Abschreibungen auf Sach- und immaterielle Anlagen.',
    EBIT:            'Betriebsgewinn vor Zinsen und Steuern, nach GF-Löhnen.',
    'EBIT-Marge':    'EBIT geteilt durch Umsatz in Prozent.',
    'EBIT Anpassung':'Korrektur für ausserordentliche oder verbundene Transaktionen.',
    'EBIT angepasst':'EBIT nach vorgenannter Anpassung.',
    'EBITC (EBIT + CEO)':
                     'Adjusted EBIT plus GF-Saläre = verfügbares Cashflow-Potential.'
  };

  // Renders one data‐row plus its injected question if CEO-Saläre
  function renderDataRow({ label, key, isInput, calcFn }) {
    // Should we show inputs in this row?
    const showInputs =
      key !== 'CEO-Saläre' ||
      (key === 'CEO-Saläre' && singleAnswer === 'Ja');

    // Build the left cell
    const firstCellKids = [
      e('button', {
        key: 'btn',
        type: 'button',
        onClick: () => toggleRow(key),
        className: 'mr-1 select-none'
      }, openRow === key ? '▼' : '▶'),
      e('span', { key: 'lbl', className: 'font-medium' }, label)
    ];

    // Inject the Ja/Nein–Frage for Einzelgeschäftsführung *inside* CEO-Saläre
    if (key === 'CEO-Saläre' && openRow === key && revComplete) {
      firstCellKids.push(
        e('div', { key: 'single', className: 'mt-2 text-sm text-gray-600' },
          e('p', { className: 'italic mb-1' },
            'Wird Ihr Unternehmen von genau einer Person geführt?'
          ),
          ['Ja','Nein'].map(opt =>
            e('label', { key: opt, className: 'flex items-center space-x-1' },
              e('input', {
                type: 'radio',
                name: 'Einzelgeschäftsführung',
                value: opt,
                checked: singleAnswer === opt,
                onChange: () => setAnswers({
                  ...answers,
                  'Einzelgeschäftsführung': opt
                })
              }),
              e('span', {}, opt)
            )
          )
        )
      );
    }

    // The main row
    const row = e('tr', { key, className: 'border-t' },
      // first column
      e('td', { className: 'bg-gray-100 align-top px-2 py-1' },
        ...firstCellKids
      ),
      // year columns
      ...years.map(y =>
        e('td', { key: y, className: 'px-1 py-1 text-right' },
          selectedYears.includes(y)
            ? (isInput && showInputs
                ? e('input', {
                    type: 'text',
                    inputMode: 'numeric',
                    className: 'w-full border rounded px-1',
                    value: formatNum(answers[`${key} ${y}`]),
                    onKeyDown: ev => {
                      if (ev.key === 'Enter') ev.preventDefault();
                    },
                    onChange: ev => setField(key, y, ev.target.value),
                    onFocus: () => {
                      if (openRow !== key) toggleRow(key);
                    }
                  })
                : (!isInput
                    ? e('span', {}, calcFn(y))
                    : null)
              )
            : null
        )
      )
    );

    return row;
  }

  // Build table head
  const head = e('thead', {},
    e('tr', {},
      e('th', { className: 'bg-gray-200 px-2 py-1 text-left' }, 'Posten'),
      ...years.map(y =>
        e('th', { key: y, className: 'bg-gray-200 px-1 py-1' }, y)
      )
    )
  );

  // Define each row
  const rows = [
    { label: 'Umsatz',          key: 'Umsatz',          isInput: true  },
    { label: 'CEO-Saläre',      key: 'CEO-Saläre',      isInput: true  },
    { label: 'Abschreibungen',  key: 'Abschreibungen',  isInput: true  },
    { label: 'EBIT',            key: 'EBIT',            isInput: true  },
    { label: 'EBIT-Marge',      key: 'EBIT-Marge',      isInput: false, calcFn: calcEBITMargin },
    { label: 'EBIT Anpassung',  key: 'EBIT Anpassung',  isInput: true  },
    { label: 'EBIT angepasst',  key: 'EBIT angepasst',  isInput: false, calcFn: calcAdjustedEBIT },
    { label: 'EBITC (EBIT + CEO)', key:'EBITC (EBIT + CEO)', isInput: false, calcFn: calcEBITC }
  ];

  return e('div', { className: 'overflow-x-auto' },
    e('table', { className: 'table-auto w-full text-sm border-collapse' },
      head,
      e('tbody', {},
        rows.map(r => renderDataRow(r))
      )
    )
  );
}

window.FinanceInput = FinanceInput;
