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
      'Umsatz':         'Geben Sie Ihren Jahresumsatz in CHF (ohne MwSt) an.',
      'Einzelgeschäftsführung':
                        'Ist Ihr Unternehmen von genau einer geschäftsführenden Person geleitet? '
                        + 'Wählen Sie „Nein“, wenn mehrere GF/Partner vorhanden sind.',
      'CEO-Saläre':     'Summe aller ausgezahlten Löhne der Geschäftsführung pro Jahr.',
      'Abschreibungen': 'Jährliche Wertminderungen auf Sach- und IMM-Vermögen.',
      'EBIT':           'Ergebnis vor Zinsen & Steuern, nach GF-Löhnen.',
      'EBIT Anpassung': 'Korrekturen für einmalige oder außerordentliche Effekte.'
    };

    // 6) accordion state
    const [openRow, setOpenRow] = useState(null);
    function toggleRow(key) {
      setOpenRow(openRow === key ? null : key);
    }

    // 7) helper to render one data-row + its explanation
    function renderDataRow({ label, key, isInput, calcFn }) {
      const row = e('tr', { key: key, className: 'border-t' },
        e('td',{ className:'px-2 py-1 bg-gray-100 flex items-center' },
          e('button',{ type:'button', onClick:()=>toggleRow(key),
                        className:'mr-2 select-none' },
            openRow===key ? '▼' : '▶'
          ),
          e('span',{}, label)
        ),
        ...years.map(y =>
          e('td',{ key:y, className:'px-2 py-1 text-center' },
            selectedYears.includes(y)
              ? (isInput
                  ? e('input',{
                      type:'text', inputMode:'numeric',
                      className:'w-24 border rounded px-1 text-right',
                      value: formatNum(answers[`${key} ${y}`]),
                      onFocus: ()=>{ if(openRow!==key) toggleRow(key); },
                      onChange:ev=>{
                        const raw = ev.target.value
                          .replace(/[^0-9\.,\-]/g,'')
                          .replace(/(\..*?)\./g,'$1')
                          .replace(/(,.*?)\,/g,'$1');
                        setAnswers({
                          ...answers,
                          [`${key} ${y}`]: raw
                        });
                      },
                      onKeyDown:ev=>{ if(ev.key==='Enter') ev.preventDefault(); }
                    })
                  : e('span',{}, calcFn(y))
                )
              : null
          )
        )
      );
      const exp = openRow===key && explanations[key]
        ? e('tr',{ key:key+'-exp' },
            e('td',{ colSpan: years.length+1,
                     className:'bg-gray-50 px-3 py-1 text-sm text-gray-600 italic' },
              explanations[key]
            )
          )
        : null;
      return [row, exp].filter(Boolean);
    }

    // 8) build wizard rows
    const rows = [];

    // Step 1: Umsatz
    rows.push(...renderDataRow({ label:'Umsatz', key:'Umsatz', isInput:true }));

    // Step 2: single‐GF question as a table row
    if (revComplete && !singleAnswer) {
      rows.push(
        e('tr',{ key:'q-single', className:'border-t' },
          // left cell: row label
          e('td',{ className:'px-2 py-1 bg-gray-100 font-medium' },
            'Einzelgeschäftsführung'
          ),
          // right cell: spans input columns
          e('td',{ colSpan: years.length, className:'px-2 py-4' },
            e('p',{ className:'mb-2' }, explanations['Einzelgeschäftsführung']),
            ['Ja','Nein'].map(opt =>
              e('label',{ key:opt, className:'flex items-center mb-1' },
                e('input',{
                  type:'radio', name:'Einzelgeschäftsführung',
                  value:opt,
                  checked: singleAnswer===opt,
                  onChange:()=>setAnswers({
                    ...answers,
                    'Einzelgeschäftsführung':opt
                  }),
                  className:'mr-2'
                }),
                opt
              )
            )
          )
        )
      );
    }

    // Step 3: CEO-Saläre (only if singleAnswer==='Ja')
    if (singleAnswer==='Ja') {
      rows.push(...renderDataRow({
        label:'CEO-Saläre', key:'CEO-Saläre', isInput:true
      }));
    }

    // Step 4: Abschreibungen
    if (singleAnswer && salaryComplete) {
      rows.push(...renderDataRow({
        label:'Abschreibungen', key:'Abschreibungen', isInput:true
      }));
    }

    // Step 5: EBIT
    if (singleAnswer && salaryComplete && depComplete) {
      rows.push(...renderDataRow({
        label:'EBIT', key:'EBIT', isInput:true
      }));
    }

    // Step 6: EBIT-Marge
    if (singleAnswer && salaryComplete && depComplete && ebitComplete) {
      rows.push(...renderDataRow({
        label:'EBIT-Marge', key:'EBIT-Marge',
        isInput:false, calcFn:calcEBITMargin
      }));
    }

    // Step 7: EBIT Anpassung
    if (singleAnswer && salaryComplete && depComplete && ebitComplete) {
      rows.push(...renderDataRow({
        label:'EBIT Anpassung', key:'EBIT Anpassung', isInput:true
      }));
    }

    // Step 8: Angepasstes EBIT & EBITC
    if (singleAnswer && salaryComplete && depComplete && ebitComplete && adjComplete) {
      rows.push(
        ...renderDataRow({
          label:'EBIT angepasst', key:'EBIT angepasst',
          isInput:false, calcFn:calcAdjustedEBIT
        }),
        ...renderDataRow({
          label:'EBITC (EBIT+CEO)', key:'EBITC',
          isInput:false, calcFn:calcEBITC
        })
      );
    }

    // 9) render full table
    return e('div',{ className:'space-y-6' },
      // year checkboxes
      e('div',{ className:'flex gap-4' },
        years.map(y=>
          e('label',{ key:y, className:'flex items-center space-x-1' },
            e('input',{
              type:'checkbox',
              checked:selectedYears.includes(y),
              onChange:()=>toggleYear(y)
            }),
            e('span',{},y)
          )
        )
      ),
      // wizard table
      e('table',{ className:'w-full table-auto border-collapse text-sm' },
        e('thead',{},
          e('tr',{},
            e('th',{ className:'px-2 py-1 bg-gray-200 text-left' }, 'Posten'),
            ...years.map(y=>
              e('th',{ key:y, className:'px-2 py-1 bg-gray-200 text-center' }, y)
            )
          )
        ),
        e('tbody',{},...rows)
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
