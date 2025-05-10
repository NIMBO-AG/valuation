// src/FinanceInput.js

function FinanceInput({ answers, setAnswers, translations, lang }) {
  const e = React.createElement;
  const allYears = [2023, 2024, 2025];
  const selectedYears = answers['Finance Years'] || [];

  // Toggle years
  function handleYearToggle(y) {
    const next = selectedYears.includes(y)
      ? selectedYears.filter(z => z !== y)
      : [...selectedYears, y].sort();
    setAnswers({ ...answers, 'Finance Years': next });
  }

  // Write a numeric answer
  function write(key, year, raw) {
    const val = raw === '' ? '' : parseFloat(raw);
    setAnswers({ ...answers, [`${key} ${year}`]: val });
  }

  // Parse safe
  function parse(key, year) {
    const v = answers[`${key} ${year}`];
    return typeof v === 'number' ? v : NaN;
  }

  // Calculations
  function ebitMargin(year) {
    const rev = parse('Umsatz', year),
          ebt = parse('EBIT', year);
    return rev > 0 && !isNaN(ebt)
      ? (ebt / rev * 100).toFixed(1) + '%'
      : '';
  }
  function adjEBIT(year) {
    const ebt = parse('EBIT', year) || 0,
          adj = parse('EBIT Anpassung', year) || 0;
    return (ebt + adj).toLocaleString('de-CH');
  }
  function ebitc(year) {
    const ceo = parse('CEO-Saläre', year) || 0;
    const adj = parse('EBIT', year) + (parse('EBIT Anpassung', year)||0);
    return (adj + ceo).toLocaleString('de-CH');
  }
  function opCost(year) {
    const rev = parse('Umsatz', year) || 0;
    const ebt = parse('EBIT', year) || 0;
    const dep = parse('Abschreibungen', year) || 0;
    const ceo = parse('CEO-Saläre', year) || 0;
    return (rev - ebt - dep - ceo).toLocaleString('de-CH');
  }

  // Accordion item component
  function AccordionItem({ title, summary, children }) {
    const [open, setOpen] = React.useState(false);
    return e('div', { className: 'border rounded mb-4' },
      // Header
      e('button', {
        onClick: () => setOpen(o => !o),
        className: 'w-full flex justify-between items-center p-2 bg-gray-100'
      },
        e('span', { className: 'font-medium' }, title),
        e('span', { className: 'text-sm flex space-x-2' },
          ...summary.map((s,i) =>
            e('span',{ key:i, className:'px-2 py-0.5 bg-white border' }, s)
          ),
          e('span', {}, open ? '–' : '+')
        )
      ),
      // Body
      open && e('div', { className: 'p-2 bg-white' }, children)
    );
  }

  // Render one section
  function renderSection(label, key, isComputed, computeFn) {
    const summary = allYears.map(y =>
      selectedYears.includes(y)
        ? (isComputed
            ? computeFn(y)
            : (answers[`${key} ${y}`] != null
                ? answers[`${key} ${y}`].toLocaleString('de-CH')
                : '')
          )
        : ''
    );

    const body = selectedYears.map(y =>
      e('div',{ key:y, className:'flex items-center mb-2' },
        e('label',{ className:'w-32' }, `${y}`),
        isComputed
          ? e('span', {}, computeFn(y))
          : e('input', {
              type: 'number',
              value: answers[`${key} ${y}`] ?? '',
              onChange: ev => write(key, y, ev.target.value),
              className: 'w-24 border rounded p-1 ml-2'
            })
      )
    );

    return e(AccordionItem,
      { title: label, summary: summary },
      body
    );
  }

  return e('div', { className: 'space-y-6' },
    // Year selector
    e('div', {},
      e('label', { className:'font-medium' },
        translations['FinanceInput.years'] || 'Welche Jahre berücksichtigen?'
      ),
      e('div',{ className:'flex gap-4 mt-1' },
        allYears.map(y =>
          e('label',{ key:y, className:'flex items-center gap-1' },
            e('input', {
              type: 'checkbox',
              checked: selectedYears.includes(y),
              onChange: () => handleYearToggle(y)
            }),
            y
          )
        )
      )
    ),

    // Only render P&L if at least one year
    selectedYears.length === 0
      ? e('p',{ className:'text-red-600' }, 'Bitte mindestens ein Jahr wählen.')
      : e('div', {}, 
          renderSection('Umsatz','Umsatz', false),
          renderSection('Gehälter GF','CEO-Saläre', false),
          renderSection(
            'Operative Kosten (Sammelposten)','', true, opCost
          ),
          renderSection('Abschreibungen','Abschreibungen', false),
          renderSection('EBIT','EBIT', false),
          renderSection('EBIT-Marge','', true, ebitMargin),
          renderSection('EBIT Anpassung','EBIT Anpassung', false),
          renderSection('Angepasstes EBIT','', true, adjEBIT),
          renderSection('EBITC (EBIT + CEO)','', true, ebitc)
        )
  );
}

window.FinanceInput = FinanceInput;
