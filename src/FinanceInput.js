// src/FinanceInput.js

function FinanceInput({ answers, setAnswers }) {
  const e = React.createElement;
  const selectedYears = answers['Finance Years'] || [];
  const years = [2023, 2024, 2025];

  function handleCheckboxChange(year) {
    const updated = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    setAnswers({ ...answers, 'Finance Years': updated });
  }

  function handleChange(key, year, val) {
    setAnswers({
      ...answers,
      [`${key} ${year}`]: val
    });
  }

  function parse(val) {
    const f = parseFloat(val);
    return isNaN(f) ? null : f;
  }

  function calcEBITMargin(year) {
    const rev = parse(answers[`Umsatz ${year}`]);
    const ebit = parse(answers[`EBIT ${year}`]);
    if (rev && ebit) return (ebit / rev * 100).toFixed(1) + '%';
    return '';
  }

  function calcAdjustedEBIT(year) {
    const ebit = parse(answers[`EBIT ${year}`]) || 0;
    const adj = parse(answers[`EBIT Anpassung ${year}`]) || 0;
    return ebit + adj;
  }

  function calcEBITC(year) {
    const adj = calcAdjustedEBIT(year);
    const ceo = parse(answers[`CEO-Saläre ${year}`]) || 0;
    return (adj + ceo).toLocaleString('de-CH');
  }

  const headRow = e('tr', {},
    e('th', {}, 'Posten'),
    ...years.map(y => e('th', {}, y))
  );

  function inputRow(label, key) {
    return e('tr', {},
      e('td', {}, label),
      ...years.map(y => e('td', {},
        selectedYears.includes(y)
          ? e('input', {
              type: 'number',
              value: answers[`${key} ${y}`] || '',
              onChange: e => handleChange(key, y, e.target.value),
              className: 'w-28 border px-1'
            })
          : null
      ))
    );
  }

  const displayRow = (label, calcFn) => e('tr', {},
    e('td', {}, label),
    ...years.map(y => e('td', {}, selectedYears.includes(y) ? calcFn(y) : ''))
  );

  return e('div', { className: 'space-y-4' },
    e('div', {},
      e('label', { className: 'font-medium' }, 'Welche Jahre sollen berücksichtigt werden?'),
      e('div', { className: 'flex gap-4 mt-1' },
        years.map(y => e('label', { className: 'flex items-center gap-1' },
          e('input', {
            type: 'checkbox',
            checked: selectedYears.includes(y),
            onChange: () => handleCheckboxChange(y)
          }),
          y
        ))
      )
    ),
    e('table', { className: 'table-auto text-sm border-collapse' },
      e('thead', {}, headRow),
      e('tbody', {},
        inputRow('Umsatz', 'Umsatz'),
        inputRow('EBIT', 'EBIT'),
        displayRow('EBIT-Marge', calcEBITMargin),
        inputRow('Abschreibungen', 'Abschreibungen'),
        inputRow('CEO-Saläre', 'CEO-Saläre'),
        inputRow('EBIT Anpassung', 'EBIT Anpassung'),
        displayRow('EBIT angepasst', calcAdjustedEBIT),
        displayRow('EBITC (EBIT + CEO)', calcEBITC)
      )
    )
  );
}

window.FinanceInput = FinanceInput;
