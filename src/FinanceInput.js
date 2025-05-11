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

    // which single row is open (show explanation)
    const [openRow, setOpenRow] = useState(null);

    function toggleYear(year) {
      const next = selectedYears.includes(year)
        ? selectedYears.filter(y => y !== year)
        : [...selectedYears, year];
      setAnswers({ ...answers, 'Finance Years': next });
    }

    // parse German‐style string into a number
    function parseNum(val) {
      const s = (val == null ? '' : String(val))
        .replace(/\./g,'')    // drop thousands sep
        .replace(',','.');
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }

    // format number with “de-CH” separators
    function formatNum(val) {
      const n = parseNum(val);
      if ((val == null || val === '') && n === 0) return '';
      return n.toLocaleString('de-CH');
    }

    // when any input changes, store it— but if it’s EBIT ensure ≤ Umsatz
    function handleChange(key, year, raw) {
      let cleaned = (raw || '')
        .replace(/[^0-9\.\-,]/g,'')
        // disallow double dots/commas
        .replace(/(\..*?)\./g,'$1')
        .replace(/(,.*?)\,/g,'$1');

      if (key === 'EBIT') {
        const entered = parseNum(cleaned);
        const rev     = parseNum(answers[`Umsatz ${year}`]);
        if (entered > rev) {
          // clamp down
          cleaned = String(rev);
        }
      }

      setAnswers({
        ...answers,
        [`${key} ${year}`]: cleaned
      });
    }

    // derived calculations
    function calcEBITMargin(y) {
      const rev  = parseNum(answers[`Umsatz ${y}`]);
      const ebit = parseNum(answers[`EBIT ${y}`]);
      return rev > 0 ? Math.round((ebit/rev)*100) + '%' : '';
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

    const explanations = {
      'Umsatz':         'Geben Sie Ihren Jahresumsatz (ohne MwSt) in CHF an.',
      'EBIT':           'Ergebnis vor Zinsen & Steuern (nach GF-Löhnen).',
      'Abschreibungen': 'Jährliche Wertminderungen auf Sach- und IMM-Güter.',
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
      setOpenRow(openRow === key ? null : key);
    }

    // table header
    const header = e('tr', {},
      e('th',{ className:'px-2 py-1 bg-gray-200 text-left' }, 'Posten'),
      ...years.map(y =>
        e('th',{ key:y,className:'px-2 py-1 bg-gray-200 text-center' }, y)
      )
    );

    // build rows + optional explanation
    const body = [];
    rows.forEach(r => {
      body.push(
        e('tr',{ key:r.key, className:'border-t' },
          e('td',{ className:'px-2 py-1 bg-gray-100 flex items-center' },
            e('button',{
              type:'button',
              onClick:()=>toggleRow(r.key),
              className:'mr-2 select-none'
            }, openRow===r.key ? '▼' : '▶'),
            e('span',{},r.label)
          ),
          ...years.map(y =>
            e('td',{ key:y, className:'px-2 py-1 text-center' },
              selectedYears.includes(y)
                ? (r.isInput
                    ? e('input',{
                        type:'text',
                        inputMode:'numeric',
                        className:'w-24 border rounded px-1 text-right',
                        value:formatNum(answers[`${r.key} ${y}`]),
                        onFocus:()=>{ if(openRow!==r.key) toggleRow(r.key); },
                        onChange:ev=>handleChange(r.key,y,ev.target.value),
                        onKeyDown:ev=>{ if(ev.key==='Enter') ev.preventDefault(); }
                      })
                    : e('span',{},r.calc(y))
                  )
                : null
            )
          )
        )
      );
      if (openRow===r.key && explanations[r.key]) {
        body.push(
          e('tr',{ key:r.key+'-exp' },
            e('td',{ colSpan:years.length+1,
                     className:'bg-gray-50 px-3 py-1 text-sm text-gray-600 italic'
            }, explanations[r.key])
          )
        );
      }
    });

    return e('div',{ className:'space-y-6' },
      // year selectors
      e('div',{ className:'flex gap-6' },
        years.map(y=>
          e('label',{ key:y, className:'flex items-center space-x-1' },
            e('input',{
              type:'checkbox',
              checked:selectedYears.includes(y),
              onChange:()=>toggleYear(y)
            }), e('span',{},y)
          )
        )
      ),
      // the table itself
      e('table',{ className:'w-full table-auto border-collapse text-sm' },
        e('thead',{},header),
        e('tbody',{},...body)
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
