// src/FinanceInput.js

function FinanceInput({ answers, setAnswers, translations, lang }) {
  const e = React.createElement;
  const allYears = [2023, 2024, 2025];
  // Per default alle Jahre auswählen, wenn noch nichts gespeichert ist
  const stored = answers['Finance Years'];
  const selectedYears = Array.isArray(stored) ? stored : allYears;

  // Toggle Year
  function handleYearToggle(y) {
    const next = selectedYears.includes(y)
      ? selectedYears.filter(z => z !== y)
      : [...selectedYears, y].sort();
    setAnswers({ ...answers, 'Finance Years': next });
  }

  // Schreibe numerischen Wert
  function write(key, year, raw) {
    const val = raw === '' ? '' : parseFloat(raw);
    setAnswers({ ...answers, [`${key} ${year}`]: val });
  }

  // Sichere Parsetaste
  function parseVal(key, year) {
    const v = answers[`${key} ${year}`];
    return typeof v === 'number' ? v : NaN;
  }

  // Berechnungen
  function ebitMargin(year) {
    const rev = parseVal('Umsatz', year),
          ebt = parseVal('EBIT', year);
    return rev > 0 && !isNaN(ebt)
      ? (ebt / rev * 100).toFixed(1) + '%'
      : '';
  }
  function adjEBIT(year) {
    const ebt = parseVal('EBIT', year) || 0,
          adj = parseVal('EBIT Anpassung', year) || 0;
    return (ebt + adj).toLocaleString('de-CH');
  }
  function ebitc(year) {
    const ceo = parseVal('CEO-Saläre', year) || 0;
    const ebt = parseVal('EBIT', year) || 0;
    const adj = parseVal('EBIT Anpassung', year) || 0;
    return (ebt + adj + ceo).toLocaleString('de-CH');
  }
  function opCost(year) {
    const rev = parseVal('Umsatz', year) || 0;
    const ebt = parseVal('EBIT', year) || 0;
    const dep = parseVal('Abschreibungen', year) || 0;
    const ceo = parseVal('CEO-Saläre', year) || 0;
    return (rev - ebt - dep - ceo).toLocaleString('de-CH');
  }

  // Accordion-Item
  function AccordionItem({ title, summary, children }) {
    const [open, setOpen] = React.useState(false);
    return e('div', { className: 'border rounded mb-4' },
      e('button', {
        onClick: () => setOpen(o => !o),
        className: 'w-full flex justify-between items-center p-2 bg-gray-100'
      },
        e('span', { className: 'font-medium' }, title),
        e('span', { className: 'text-sm flex space-x-2' },
          ...summary.map((s,i) =>
            e('span', { key: i, className: 'px-2 py-0.5 bg-white border' }, s)
          ),
          e('span', {}, open ? '–' : '+')
        )
      ),
      open && e('div', { className: 'p-2 bg-white' }, children)
    );
  }

  // Sektion rendern
  function renderSection(label, key, isComputed, computeFn) {
    const summary = allYears.map(y =>
      selectedYears.includes(y)
        ? (isComputed
            ? computeFn(y)
            : (answers[`${key} ${y}`] != null
                ? answers[`${key} ${y}`].toLocaleString('de-CH')
                : ''
              )
          )
        : ''
    );

    const body = selectedYears.map(y =>
      e('div', { key: y, className: 'flex items-center mb-2' },
        e('label', { className: 'w-32' }, `${y}`),
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

    return e(AccordionItem, { title: label, summary }, body);
  }

  return e('div', { className: 'space-y-6' },
    // Jahresauswahl
    e('div', {},
      e('label', { className: 'font-medium' },
        translations['FinanceInput.years'] || 'Welche Jahre berücksichtigen?'
      ),
      e('div', { className: 'flex gap-4 mt-1' },
        allYears.map(y =>
          e('label', { key: y, className: 'flex items-center gap-1' },
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

    // P&L-Sektionen
    selectedYears.length === 0
      ? e('p', { className: 'text-red-600' }, 'Bitte mindestens ein Jahr wählen.')
      : e('div', {},
          renderSection('Umsatz', 'Umsatz', false),
          renderSection('Gehälter GF', 'CEO-Saläre', false),
          renderSection('Operative Kosten (Sammelposten)', '', true, opCost),
          renderSection('Abschreibungen', 'Abschreibungen', false),
          renderSection('EBIT', 'EBIT', false),
          renderSection('EBIT-Marge', '', true, ebitMargin),
          renderSection('EBIT Anpassung', 'EBIT Anpassung', false),
          renderSection('Angepasstes EBIT', '', true, adjEBIT),
          renderSection('EBITC (EBIT + CEO)', '', true, ebitc)
        )
  );
}

window.FinanceInput = FinanceInput;
