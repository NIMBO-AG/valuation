// src/FinanceInput.js

;(function(){
  const { useEffect, useState } = React;

  function FinanceInput({ answers, setAnswers }) {
    const e = React.createElement;
    const years = [2023, 2024, 2025];

    // 1) Default: alle Jahre vorauswählen
    useEffect(() => {
      if (!Array.isArray(answers['Finance Years'])) {
        setAnswers({ ...answers, 'Finance Years': [...years] });
      }
    }, []);

    const selectedYears = answers['Finance Years'] || [];
    const [openRow, setOpenRow] = useState('Umsatz');

    // 2) Parsen & Formatieren
    function parseNum(val) {
      if (val == null) return null;
      const s = val.toString()
        .replace(/['\u2019]/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.');
      const f = parseFloat(s);
      return isNaN(f) ? null : f;
    }
    function formatNum(val) {
      const n = parseNum(val);
      return n == null ? '' : n.toLocaleString('de-CH');
    }

    // 3) Abhängigkeits-Flags
    const revC  = selectedYears.every(y => parseNum(answers[`Umsatz ${y}`]) != null);
    const ceoQ  = answers['Einzelgeschäftsführung'] != null;
    const ceoC  = revC && ceoQ && selectedYears.every(y => parseNum(answers[`CEO-Saläre ${y}`]) != null);
    const absC  = ceoC && selectedYears.every(y => parseNum(answers[`Abschreibungen ${y}`]) != null);
    const ebitC = absC && selectedYears.every(y => parseNum(answers[`EBIT ${y}`]) != null);
    const adjC  = ebitC && selectedYears.every(y => parseNum(answers[`EBIT Anpassung ${y}`]) != null);

    // 4) Setter-Funktionen
    function toggleRow(key) {
      setOpenRow(openRow === key ? null : key);
    }
    function setField(key, y, raw) {
      if (key === 'EBIT') {
        const rev = parseNum(answers[`Umsatz ${y}`]),
              val = parseNum(raw);
        if (rev != null && val != null && val > rev) raw = rev.toString();
      }
      setAnswers({ ...answers, [`${key} ${y}`]: raw });
    }
    function setSingle(ans) {
      setAnswers({ ...answers, 'Einzelgeschäftsführung': ans });
    }

    // 5) Kalkulationen
    function calcEBITMargin(y) {
      const rev  = parseNum(answers[`Umsatz ${y}`]) || 0;
      const ebit = parseNum(answers[`EBIT ${y}`])   || 0;
      return rev>0 ? Math.round(ebit/rev*100)+'%' : '';
    }
    function calcAdjEBIT(y) {
      const ebit = parseNum(answers[`EBIT ${y}`])      || 0;
      const adj  = parseNum(answers[`EBIT Anpassung ${y}`]) || 0;
      return ebit + adj;
    }
    function calcEBITC(y) {
      const ceo = parseNum(answers[`CEO-Saläre ${y}`]) || 0;
      return formatNum((calcAdjEBIT(y)+ceo).toString());
    }

    // 6) Reihen-Definition
    const rows = [
      { label:'Umsatz',           key:'Umsatz',         input:true,  show:()=>true   },
      { label:'CEO-Saläre',       key:'CEO-Saläre',     input:true,  show:()=>revC   },
      { label:'Abschreibungen',   key:'Abschreibungen', input:true,  show:()=>ceoC   },
      { label:'EBIT',             key:'EBIT',           input:true,  show:()=>absC   },
      { label:'EBIT-Marge',       key:'EBIT-Marge',     input:false, show:()=>ebitC  },
      { label:'EBIT Anpassung',   key:'EBIT Anpassung', input:true,  show:()=>ebitC  },
      { label:'EBIT angepasst',   key:'EBIT angepasst', input:false, show:()=>ebitC  },
      { label:'EBITC (EBIT+CEO)', key:'EBITC (EBIT+CEO)',input:false,show:()=>ebitC }
    ].filter(r => r.show());

    // 7) Row-Renderer
    function renderRow(r) {
      const { label, key, input } = r;
      const isOpen = openRow === key;

      // ───────── Spezialfall Umsatz ─────────
      if (key === 'Umsatz') {
        const main = e('tr',{ key },
          e('td',{ className:'bg-gray-100 px-2 py-1 w-2/5 select-none' },
            e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
              isOpen?'▼':'▶'
            ),
            e('span',{ className:'font-medium' }, label)
          ),
          years.map(y=>e('td',{ key:y, className:'px-1 py-1 text-right' },
            selectedYears.includes(y)
              ? e('input',{
                  type:'text',
                  className:'w-full border rounded px-1',
                  inputMode:'numeric',
                  value: formatNum(answers[`${key} ${y}`]),
                  onKeyDown:ev=>ev.key==='Enter'&&ev.preventDefault(),
                  onFocus:()=>!isOpen&&toggleRow(key),
                  onChange:ev=>setField(key,y,ev.target.value)
                })
              : null
          ))
        );
        if (isOpen) {
          const info = e('tr',{ key:key+'-instr' },
            e('td',{ colSpan:years.length+1, className:'bg-gray-50 px-2 py-2 italic text-gray-700' },
              'Jahresumsatz in CHF (ohne MWSt.)'
            )
          );
          // erst info, dann main
          return [ info, main ];
        }
        return main;
      }

      // ───────── Spezialfall CEO-Saläre ─────────
      if (key === 'CEO-Saläre') {
        const answered = answers['Einzelgeschäftsführung'] != null;
        const main = e('tr',{ key },
          e('td',{ className:'bg-gray-100 px-2 py-1 w-2/5 select-none' },
            e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
              isOpen?'▼':'▶'
            ),
            e('span',{ className:'font-medium' }, label)
          ),
          years.map(y=>e('td',{ key:y, className:'px-1 py-1 text-right' },
            answered && selectedYears.includes(y)
              ? e('input',{
                  type:'text',
                  className:'w-full border rounded px-1',
                  inputMode:'numeric',
                  value: formatNum(answers[`${key} ${y}`]),
                  onKeyDown:ev=>ev.key==='Enter'&&ev.preventDefault(),
                  onFocus:()=>!isOpen&&toggleRow(key),
                  onChange:ev=>setField(key,y,ev.target.value)
                })
              : e('div',{},'\u00a0')
          ))
        );
        if (isOpen) {
          const text = !answered
            ? 'Führen Sie das Unternehmen allein? („Nein“ bei mehreren Partner:innen.)'
            : 'Geben Sie hier das Jahresgehalt des/der Geschäftsführer:in in CHF an.';
          const info = e('tr',{ key:key+'-sub' },
            e('td',{ colSpan:years.length+1, className:'bg-gray-50 px-2 py-2' },
              e('p',{ className:'italic text-gray-700 mb-1' }, text),
              !answered && ['Ja','Nein'].map(opt=>
                e('label',{ key:opt, className:'inline-flex items-center mr-4' },
                  e('input',{ type:'radio', name:'Einzelgeschäftsführung', value:opt,
                    onChange:()=>setSingle(opt)
                  }),
                  e('span',{ className:'ml-1' },opt)
                )
              )
            )
          );
          // erst info, dann main
          return [ info, main ];
        }
        return main;
      }

      // ───────── Alle anderen ─────────
      return e('tr',{ key },
        e('td',{ className:'bg-gray-100 px-2 py-1 w-2/5 select-none' },
          e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
            isOpen?'▼':'▶'
          ),
          e('span',{ className:'font-medium' }, label)
        ),
        years.map(y=>e('td',{ key:y, className:'px-1 py-1 text-right' },
          selectedYears.includes(y)
            ? input
              ? e('input',{ 
                  type:'text',
                  className:'w-full border rounded px-1',
                  inputMode:'numeric',
                  value: formatNum(answers[`${key} ${y}`]),
                  onKeyDown:ev=>ev.key==='Enter'&&ev.preventDefault(),
                  onFocus:()=>!isOpen&&toggleRow(key),
                  onChange:ev=>setField(key,y,ev.target.value)
                })
              : e('span',{}, 
                  key==='EBIT-Marge'       ? calcEBITMargin(y)
                : key==='EBIT angepasst'     ? formatNum(calcAdjEBIT(y).toString())
                : key==='EBITC (EBIT+CEO)'   ? calcEBITC(y)
                : ''
              )
            : null
        ))
      );
    }

    // 8) Tabelle rendern
    return e('div',{ className:'overflow-x-auto' },
      e('table',{ className:'table-fixed w-full text-sm border-collapse' },
        e('thead',{},
          e('tr',{},
            e('th',{ className:'bg-gray-200 px-2 py-1 text-left w-2/5' },'Posten'),
            ...years.map(y=>
              e('th',{ key:y, className:'bg-gray-200 px-1 py-1 text-center w-1/5' }, y)
            )
          )
        ),
        e('tbody',{}, rows.flatMap(r=>renderRow(r)))
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
