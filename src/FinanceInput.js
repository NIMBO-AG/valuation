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

    // which rows are "open" (show explanation)
    const [openRows, setOpenRows] = useState(new Set());

    function toggleYear(year) {
      const next = selectedYears.includes(year)
        ? selectedYears.filter(y => y !== year)
        : [...selectedYears, year];
      setAnswers({ ...answers, 'Finance Years': next });
    }

    function handleChange(key, year, raw) {
      // allow only digits, comma, dot, minus
      const cleaned = (raw || '')
        .replace(/[^0-9\.\-,]/g, '')
        .replace(/(\..*?)\./g, '$1')
        .replace(/(,.*?)\,/g, '$1');
      setAnswers({
        ...answers,
        [`${key} ${year}`]: cleaned
      });
    }

    function parseNum(val) {
      const str = (val == null ? '' : String(val));
      const normalized = str
        .replace(/\./g, '')    // drop thousands
        .replace(',', '.');    // comma → decimal
      const n = parseFloat(normalized);
      return isNaN(n) ? 0 : n;
    }

    function formatNum(val) {
      const n = parseNum(val);
      // blank if original was blank
      if ((val == null || val === '') && n === 0) return '';
      return n.toLocaleString('de-CH');
    }

    // computations
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

    // explanations text
    const explanations = {
      'Umsatz':         'Geben Sie Ihren Jahresumsatz (ohne MwSt) in CHF an.',
      'EBIT':           'Ergebnis vor Zinsen & Steuern (nach GF-Löhnen).',
      'Abschreibungen': 'Jährliche Wertminderungen auf Ihre Sach- und IMM-Güter.',
      'CEO-Saläre':     'Summe aller ausgezahlten Löhne der Geschäftsführung.',
      'EBIT Anpassung': 'Korrekturen für einmalige oder außerordentliche Effekte.'
    };

    const rows = [
      { label:'Umsatz',          key:'Umsatz',          isInput:true },
      { label:'EBIT',            key:'EBIT',            isInput:true },
      { label:'EBIT-Marge',      key:'EBIT-Marge',      isInput:false, calc:calcEBITMargin },
      { label:'Abschreibungen',  key:'Abschreibungen',  isInput:true },
      { label:'CEO-Saläre',      key:'CEO-Saläre',      isInput:true },
      { label:'EBIT Anpassung',  key:'EBIT Anpassung',  isInput:true },
      { label:'EBIT angepasst',  key:'EBIT angepasst',  isInput:false, calc:calcAdjustedEBIT },
      { label:'EBITC (EBIT+CEO)',key:'EBITC',           isInput:false, calc:calcEBITC },
    ];

    function toggleRow(key) {
      const next = new Set(openRows);
      next.has(key) ? next.delete(key) : next.add(key);
      setOpenRows(next);
    }

    // table header
    const header = e('tr', {},
      e('th', { className:'px-2 py-1 bg-gray-200 text-left' }, 'Posten'),
      ...years.map(y =>
        e('th', { key:y, className:'px-2 py-1 bg-gray-200 text-center' }, y)
      )
    );

    // build body
    const body = [];
    rows.forEach(r => {
      // the main row
      body.push(
        e('tr', { key:r.key, className:'border-t' },
          // label + toggle
          e('td', { className:'px-2 py-1 bg-gray-100 flex items-center' },
            e('button', {
              type:'button',
              onClick:()=>toggleRow(r.key),
              className:'mr-2 select-none'
            }, openRows.has(r.key) ? '▼' : '▶'),
            e('span',{}, r.label)
          ),
          // values
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

      // explanation row *below* the inputs
      if (openRows.has(r.key) && explanations[r.key]) {
        body.push(
          e('tr',{ key:r.key+'-exp' },
            e('td',{
              colSpan: years.length+1,
              className:'bg-gray-50 px-3 py-1 text-sm text-gray-600 italic'
            }, explanations[r.key])
          )
        );
      }
    });

    return e('div',{ className:'space-y-6' },
      // year selectors
      e('div',{ className:'flex gap-6' },
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

      // the P&L table
      e('table',{ className:'w-full table-auto border-collapse text-sm' },
        e('thead',{}, header),
        e('tbody',{}, ...body)
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
