// src/FinanceInput.js

(function() {
  const { useState } = React;

  function FinanceInput({ answers, setAnswers }) {
    const e = React.createElement;
    const years = [2023, 2024, 2025];

    // default all years selected if none stored yet
    const selectedYears = Array.isArray(answers['Finance Years'])
      ? answers['Finance Years']
      : years;

    const [openRows, setOpenRows] = useState(new Set());

    function toggleYear(year) {
      const next = selectedYears.includes(year)
        ? selectedYears.filter(y => y !== year)
        : [...selectedYears, year];
      setAnswers({ ...answers, 'Finance Years': next });
    }

    function handleChange(key, year, raw) {
      // strip any non-digit/comma/dot/minus
      const cleaned = (raw || '')
        .replace(/[^0-9\.\-,]/g, '')
        // keep only first comma/dot for decimal
        .replace(/(\..*?)\./g,'$1')
        .replace(/(,.*?)\,/g,'$1');
      setAnswers({
        ...answers,
        [`${key} ${year}`]: cleaned
      });
    }

    // --- FIXED: always coerce to string first ---
    function parseNum(val) {
      const str = (val == null ? '' : String(val));
      const normalized = str
        .replace(/\./g, '')    // remove thousands
        .replace(',', '.');    // comma → decimal
      const n = parseFloat(normalized);
      return isNaN(n) ? 0 : n;
    }

    function formatNum(val) {
      const n = parseNum(val);
      return n === 0 && (val == null || val === '' || parseNum(val) === 0)
        ? ''
        : n.toLocaleString('de-CH');
    }

    // computations
    function calcEBITMargin(y) {
      const rev  = parseNum(answers[`Umsatz ${y}`]);
      const ebit = parseNum(answers[`EBIT ${y}`]);
      return rev > 0
        ? (ebit / rev * 100).toFixed(1) + '%'
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

    // explanations
    const explanations = {
      'Umsatz':          'Ihr Gesamtumsatz im Jahr in CHF (ohne MwSt).',
      'EBIT':            'Ergebnis vor Zinsen & Steuern, nach GF-Löhnen.',
      'Abschreibungen':  'Jährliche Wertminderungen auf Anlagevermögen.',
      'CEO-Saläre':      'Total ausgezahlte Löhne aller Geschäftsführer.',
      'EBIT Anpassung':  'Korrekturen für außerordentliche Effekte.'
    };

    const rows = [
      { label:'Umsatz', key:'Umsatz',          isInput:true },
      { label:'EBIT',   key:'EBIT',            isInput:true },
      { label:'EBIT-Marge', key:'EBIT-Marge',  isInput:false, calc: calcEBITMargin },
      { label:'Abschreibungen', key:'Abschreibungen', isInput:true },
      { label:'CEO-Saläre', key:'CEO-Saläre', isInput:true },
      { label:'EBIT Anpassung', key:'EBIT Anpassung', isInput:true },
      { label:'EBIT angepasst', key:'EBIT angepasst', isInput:false, calc: calcAdjustedEBIT },
      { label:'EBITC (EBIT + CEO)', key:'EBITC', isInput:false, calc: calcEBITC },
    ];

    function toggleRow(key) {
      const next = new Set(openRows);
      next.has(key) ? next.delete(key) : next.add(key);
      setOpenRows(next);
    }

    // build table header
    const header = e('tr', {},
      e('th',{ className:'px-2 py-1 bg-gray-200 text-left' }, 'Posten'),
      ...years.map(y =>
        e('th',{ key:y, className:'px-2 py-1 bg-gray-200 text-center' }, y)
      )
    );

    // build each row (and optional explanation)
    const body = [];
    rows.forEach(r => {
      const isOpen = openRows.has(r.key);
      if (isOpen && explanations[r.key]) {
        body.push(
          e('tr',{ key:r.key+'-exp' },
            e('td',{
                colSpan: years.length+1,
                className:'bg-gray-50 px-3 py-1 text-sm text-gray-600 italic'
              },
              explanations[r.key]
            )
          )
        );
      }
      body.push(
        e('tr',{ key:r.key, className:'border-t' },
          // label + toggle
          e('td',{ className:'px-2 py-1 bg-gray-100 flex items-center' },
            e('button',{
                type:'button',
                onClick:()=>toggleRow(r.key),
                className:'mr-2 text-lg select-none'
              },
              isOpen ? '▼' : '▶'
            ),
            e('span',{}, r.label)
          ),
          // data cells
          ...years.map(y =>
            e('td',{ key:y, className:'px-2 py-1 text-center' },
              selectedYears.includes(y)
                ? (r.isInput
                    ? e('input',{
                        type:'text',
                        inputMode:'numeric',
                        className:'w-24 border rounded px-1 text-right',
                        value: formatNum(answers[`${r.key} ${y}`]),
                        onChange:ev=>handleChange(r.key,y,ev.target.value),
                        onKeyDown:ev=>{ if(ev.key==='Enter') ev.preventDefault(); }
                      })
                    : e('span',{}, r.calc(y))
                  )
                : null
            )
          )
        )
      );
    });

    return e('div',{ className:'space-y-4' },
      // year toggles
      e('div',{ className:'flex gap-4' },
        years.map(y =>
          e('label',{ key:y, className:'flex items-center space-x-1' },
            e('input',{
              type:'checkbox',
              checked: selectedYears.includes(y),
              onChange:()=>toggleYear(y)
            }),
            e('span',{}, y)
          )
        )
      ),
      // P&L table
      e('table',{ className:'w-full table-auto border-collapse text-sm' },
        e('thead',{}, header),
        e('tbody',{}, ...body)
      )
    );
  }

  window.FinanceInput = FinanceInput;
})(); 
