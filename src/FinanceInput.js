// src/FinanceInput.js

function FinanceInput({ answers, setAnswers }) {
  const e = React.createElement;
  const years = [2023, 2024, 2025];

  // if the user hasn't yet chosen any years, default to all three
  const selectedYears = Array.isArray(answers['Finance Years'])
    ? answers['Finance Years']
    : years;

  function toggleYear(year) {
    const next = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    setAnswers({ ...answers, 'Finance Years': next });
  }

  function handleChange(key, year, val) {
    // store raw string; we'll format it when we display
    setAnswers({ ...answers, [`${key} ${year}`]: val });
  }

  function parseNum(val) {
    // parse either "." or "," decimals
    const n = parseFloat(
      typeof val === 'string'
        ? val.replace(',', '.')
        : val
    );
    return isNaN(n) ? 0 : n;
  }

  function formatNum(val) {
    const n = parseFloat(val);
    return isNaN(n)
      ? ''
      : n.toLocaleString('de-CH');
  }

  // Calculations
  function calcEBITMargin(year) {
    const rev  = parseNum(answers[`Umsatz ${year}`]);
    const ebit = parseNum(answers[`EBIT ${year}`]);
    return rev > 0
      ? (ebit / rev * 100).toFixed(1) + '%'
      : '';
  }

  function calcAdjustedEBIT(year) {
    const ebit = parseNum(answers[`EBIT ${year}`]);
    const adj  = parseNum(answers[`EBIT Anpassung ${year}`]);
    return formatNum(ebit + adj);
  }

  function calcEBITC(year) {
    const adj   = parseNum(calcAdjustedEBIT(year));
    const ceo   = parseNum(answers[`CEO-Saläre ${year}`]);
    return formatNum(adj + ceo);
  }

  // Header row
  const headerRow = e('tr', {},
    e('th', { className: 'p-2 text-left bg-gray-200' }, 'Posten'),
    ...years.map(y =>
      e('th', {
        key: y,
        className: 'p-2 bg-gray-200 text-center'
      }, y)
    )
  );

  // Factory for each data row
  function renderRow(label, key, isInput = true, calcFn = null) {
    return e('tr', { className: 'border-t' },
      // label cell + “+” toggle
      e('td', {
        className: 'p-2 bg-gray-100 flex items-center'
      },
        e('span', {}, label),
        e('button', {
          type:      'button',         // <-- prevent submit
          className: 'ml-auto px-2',
          onClick:   () => {}          // placeholder for future accordion
        }, '+')
      ),

      // one cell per year
      ...years.map(y => e('td', {
        key:    y,
        className: 'p-2 text-center'
      },
        selectedYears.includes(y)
          ? isInput
            // editable input
            ? e('input', {
                type:       'text',
                inputMode:  'numeric',
                value:      answers[`${key} ${y}`] || '',
                onChange:   ev => handleChange(key, y, ev.target.value),
                onKeyDown:  ev => {
                  if (ev.key === 'Enter') ev.preventDefault();
                },
                className:  'w-24 border rounded px-1 text-right'
              })
            // computed display
            : e('span', {}, calcFn(y))
          : null
      ))
    );
  }

  return e('div', { className: 'space-y-4' },
    // year‐checkboxes
    e('div', { className: 'flex items-center gap-4' },
      years.map(y =>
        e('label', { key: y, className: 'flex items-center space-x-1' },
          e('input', {
            type:     'checkbox',
            checked:  selectedYears.includes(y),
            onChange: () => toggleYear(y)
          }),
          e('span', {}, y)
        )
      )
    ),

    // the P&L table
    e('table', { className: 'w-full table-auto border-collapse text-sm' },
      e('thead', {}, headerRow),
      e('tbody', {},
        renderRow('Umsatz',              'Umsatz'),
        renderRow('EBIT',                'EBIT'),
        renderRow('EBIT-Marge',          'EBIT-Marge',   false, calcEBITMargin),
        renderRow('Abschreibungen',      'Abschreibungen'),
        renderRow('CEO-Saläre',          'CEO-Saläre'),
        renderRow('EBIT Anpassung',      'EBIT Anpassung'),
        renderRow('EBIT angepasst',      'EBIT angepasst', false, calcAdjustedEBIT),
        renderRow('EBITC (EBIT + CEO)',  'EBITC',         false, calcEBITC)
      )
    )
  );
}

window.FinanceInput = FinanceInput;
