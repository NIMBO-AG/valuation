// src/FinanceInput.js

(function(){
  const { useEffect, useState } = React;

  function FinanceInput({ answers, setAnswers }) {
    const e = React.createElement;
    const years = [2023, 2024, 2025];

    // 1) Wenn noch nicht gesetzt, alle Jahre vorauswählen
    useEffect(() => {
      if (!Array.isArray(answers['Finance Years'])) {
        setAnswers({ ...answers, 'Finance Years': [...years] });
      }
    }, []);

    const selectedYears = answers['Finance Years'] || [];

    // 2) State, welche Zeile aufgeklappt ist
    const [openRow, setOpenRow] = useState('Umsatz');

    // 3) Helfer zum Parsen/Formatieren
    function parseNum(val) {
      if (val == null) return null;
      const str = val.toString();
      const cleaned = str
        .replace(/\./g, '')      // Punkte (Tsd.-Trenner) entfernen
        .replace(/,/g, '.')      // Komma → Dezimalpunkt
        .replace(/[^\d.\-]/g, '');// alles andere raus
      const f = parseFloat(cleaned);
      return isNaN(f) ? null : f;
    }
    function formatNum(val) {
      const n = parseNum(val);
      return n == null ? '' : n.toLocaleString('de-CH');
    }

    // 4) Completion-Flags
    const revC  = selectedYears.every(y => parseNum(answers[`Umsatz ${y}`]) != null);
    const ceoQ  = answers['Einzelgeschäftsführung'] != null;
    const ceoC  = revC && ceoQ && selectedYears.every(y => parseNum(answers[`CEO-Saläre ${y}`]) != null);
    const absC  = ceoC && selectedYears.every(y => parseNum(answers[`Abschreibungen ${y}`]) != null);
    const ebitC = absC && selectedYears.every(y => parseNum(answers[`EBIT ${y}`]) != null);
    const adjC  = ebitC && selectedYears.every(y => parseNum(answers[`EBIT Anpassung ${y}`]) != null);

    // 5) Umschalter & Setter
    function toggleRow(key) {
      setOpenRow(openRow === key ? null : key);
    }
    function setField(key, y, raw) {
      // EBIT darf nie > Umsatz sein
      if (key === 'EBIT') {
        const rev = parseNum(answers[`Umsatz ${y}`]);
        const val = parseNum(raw);
        if (rev != null && val != null && val > rev) {
          raw = rev.toString();
        }
      }
      setAnswers({ ...answers, [`${key} ${y}`]: raw });
    }
    function setSingle(ans) {
      setAnswers({ ...answers, 'Einzelgeschäftsführung': ans });
    }

    // 6) Kalkulationsfunktionen
    function calcEBITMargin(y) {
      const rev  = parseNum(answers[`Umsatz ${y}`]) || 0;
      const ebit = parseNum(answers[`EBIT ${y}`])   || 0;
      return rev > 0 && ebit >= 0
        ? Math.round((ebit/rev)*100) + '%'
        : '';
    }
    function calcAdjEBIT(y) {
      const ebit = parseNum(answers[`EBIT ${y}`])     || 0;
      const adj  = parseNum(answers[`EBIT Anpassung ${y}`]) || 0;
      return ebit + adj;
    }
    function calcEBITC(y) {
      const ceo = parseNum(answers[`CEO-Saläre ${y}`]) || 0;
      return formatNum((calcAdjEBIT(y) + ceo).toString());
    }

    // 7) Reihen-Definition mit show-Funktion
    const rows = [
      { label:'Umsatz',           key:'Umsatz',         input:true,  show:()=>true   },
      { label:'CEO-Saläre',       key:'CEO-Saläre',     input:true,  show:()=>revC   },
      { label:'Abschreibungen',   key:'Abschreibungen', input:true,  show:()=>ceoC   },
      { label:'EBIT',             key:'EBIT',           input:true,  show:()=>absC   },
      { label:'EBIT-Marge',       key:'EBIT-Marge',     input:false, show:()=>ebitC  },
      { label:'EBIT Anpassung',   key:'EBIT Anpassung', input:true,  show:()=>ebitC  },
      { label:'EBIT angepasst',   key:'EBIT angepasst', input:false, show:()=>ebitC  },
      { label:'EBITC (EBIT+CEO)', key:'EBITC (EBIT+CEO)',input:false, show:()=>ebitC }
    ].filter(r => r.show());

    // 8) Einzelfall-Renderer
    function renderRow(r) {
      const { label, key, input } = r;
      const isOpen = openRow === key;

      // 8a) Speziell: Umsatz-Sub-Row mit Erklärung
      if (key === 'Umsatz' && isOpen) {
        // Haupt-Zeile
        const mainRow = e('tr',{ key },
          e('td',{ className:'bg-gray-100 px-2 py-1 w-56 select-none' },
            e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
              isOpen ? '▼' : '▶'
            ),
            e('span',{ className:'font-medium' }, label)
          ),
          years.map(y => e('td',{ key:y, className:'px-1 py-1 text-right' },
            selectedYears.includes(y)
              ? e('input',{
                  type:'text',
                  className:'w-full border rounded px-1',
                  inputMode:'numeric',
                  value: formatNum(answers[`${key} ${y}`]),
                  onKeyDown: ev=>{ if(ev.key==='Enter') ev.preventDefault(); },
                  onFocus: ()=>{ if(!isOpen) toggleRow(key); },
                  onChange: ev=> setField(key, y, ev.target.value)
                })
              : null
          ))
        );
        // Sub-Row mit Erklärungstext
        const subRow = e('tr',{ key: key+'-info' },
          e('td',{ colSpan: years.length+1, className:'bg-gray-50 px-2 py-2 italic text-gray-600' },
            'Geben Sie hier den Jahresumsatz in CHF an (ohne MwSt).'
          )
        );
        return [ mainRow, subRow ];
      }

      // 8b) Speziell: CEO-Frage vor Eingabe (wie gehabt) …
      if (key==='CEO-Saläre' && revC && answers['Einzelgeschäftsführung']===undefined) {
        return e('tr',{ key:key+'-ask' },
          e('td',{ className:'bg-gray-100 px-2 py-1 w-56 select-none' },
            e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
              openRow===key ? '▼' : '▶'
            ),
            e('span',{ className:'font-medium' }, label)
          ),
          e('td',{ colSpan:years.length, className:'bg-gray-50 px-2 py-2' },
            e('p',{ className:'italic text-gray-700 mb-1' },
              'Führen Sie das Unternehmen allein? (Wählen Sie „Nein“ bei mehreren Partner:innen)'
            ),
            ['Ja','Nein'].map(opt =>
              e('label',{ key:opt, className:'inline-flex items-center mr-4' },
                e('input',{ type:'radio',
                  name:'Einzelgeschäftsführung',
                  value:opt,
                  onChange:()=>setSingle(opt)
                }),
                e('span',{ className:'ml-1' },opt)
              )
            )
          )
        );
      }

      // 8c) Normale Zeile
      const mainRow = e('tr',{ key },
        e('td',{ className:'bg-gray-100 px-2 py-1 w-56 select-none' },
          e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
            isOpen ? '▼' : '▶'
          ),
          e('span',{ className:'font-medium' },label)
        ),
        years.map(y => e('td',{ key:y, className:'px-1 py-1 text-right' },
          selectedYears.includes(y)
            ? input
              ? e('input',{
                  type:'text',
                  className:'w-full border rounded px-1',
                  inputMode:'numeric',
                  value: formatNum(answers[`${key} ${y}`]),
                  onKeyDown: ev=>{ if(ev.key==='Enter') ev.preventDefault(); },
                  onFocus: ()=>{ if(!isOpen) toggleRow(key); },
                  onChange: ev=> setField(key,y,ev.target.value)
                })
              : e('span',{}, 
                  key==='EBIT-Marge'         ? calcEBITMargin(y)
                : key==='EBIT angepasst'     ? formatNum(calcAdjEBIT(y).toString())
                : key==='EBITC (EBIT+CEO)'   ? calcEBITC(y)
                : ''
              )
            : null
        ))
      );

      // 8d) Sub-Row für CEO-Frage nach dem Wechsel (wie gehabt) …
      if (key==='CEO-Saläre' && isOpen && revC && answers['Einzelgeschäftsführung']!=null) {
        const sub = e('tr',{ key:key+'-sub' },
          e('td',{ colSpan:years.length+1, className:'bg-gray-50 px-2 py-2' },
            e('p',{ className:'italic text-gray-700 mb-1' },
              'Führen Sie das Unternehmen allein? (Wählen Sie „Nein“ bei mehreren Partner:innen)'
            ),
            ['Ja','Nein'].map(opt =>
              e('label',{ key:opt, className:'inline-flex items-center mr-4' },
                e('input',{ type:'radio',
                  name:'Einzelgeschäftsführung',
                  value:opt,
                  checked: answers['Einzelgeschäftsführung']===opt,
                  onChange:()=>setSingle(opt)
                }),
                e('span',{ className:'ml-1' },opt)
              )
            )
          )
        );
        return [ mainRow, sub ];
      }

      return mainRow;
    }

    // 9) Vollständige Tabelle
    return e('div',{ className:'overflow-x-auto' },
      e('table',{ className:'table-auto w-full text-sm border-collapse' },
        e('thead',{}, 
          e('tr',{},
            e('th',{ className:'bg-gray-200 px-2 py-1 text-left w-56' },'Posten'),
            ...years.map(y=>
              e('th',{ key:y, className:'bg-gray-200 px-1 py-1' },y)
            )
          )
        ),
        e('tbody',{}, rows.flatMap(r=>renderRow(r)))
      )
    );
  }

  window.FinanceInput = FinanceInput;
})();
