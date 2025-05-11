// src/FinanceInput.js

function FinanceInput({ answers, setAnswers }) {
  const e = React.createElement;
  const years = [2023, 2024, 2025];

  // 1) Wenn noch nicht gesetzt, alle Jahre vorauswählen
  React.useEffect(() => {
    if (!Array.isArray(answers['Finance Years'])) {
      setAnswers({ ...answers, 'Finance Years': [...years] });
    }
  }, []);

  const selectedYears = answers['Finance Years'] || [];

  // 2) State, welche Zeile aufgeklappt ist
  const [openRow, setOpenRow] = React.useState('Umsatz');

  // 3) Helfer zum Parsen/Formatieren
  function parseNum(val) {
    if (typeof val !== 'string') return null;
    const cleaned = val
      .replace(/\./g, '')   // Punkte (Tsd.-Trenner) entfernen
      .replace(/,/g, '.')   // Komma → Dezimalpunkt
      .replace(/[^\d.\-]/g, '');
    const f = parseFloat(cleaned);
    return isNaN(f) ? null : f;
  }
  function formatNum(val) {
    const n = parseNum(val);
    return n === null ? '' : n.toLocaleString('de-CH');
  }

  // 4) Completion-Flags
  const revC   = selectedYears.every(y => parseNum(answers[`Umsatz ${y}`]) !== null);
  const ceoQ   = answers['Einzelgeschäftsführung'] !== undefined;
  const ceoC   = revC && ceoQ && selectedYears.every(y => parseNum(answers[`CEO-Saläre ${y}`]) !== null);
  const absC   = ceoC && selectedYears.every(y => parseNum(answers[`Abschreibungen ${y}`]) !== null);
  const ebitC  = absC && selectedYears.every(y => parseNum(answers[`EBIT ${y}`]) !== null);
  const adjC   = ebitC && selectedYears.every(y => parseNum(answers[`EBIT Anpassung ${y}`]) !== null);

  // 5) Umschalter & Setter
  function toggleRow(key) {
    setOpenRow(openRow === key ? null : key);
  }
  function setField(key, y, raw) {
    // EBIT darf nicht > Umsatz sein
    if (key === 'EBIT') {
      const rev = parseNum(answers[`Umsatz ${y}`]);
      const val = parseNum(raw);
      if (rev !== null && val !== null && val > rev) {
        raw = rev.toString();
      }
    }
    setAnswers({ ...answers, [`${key} ${y}`]: raw });
  }
  function setSingle(ans) {
    setAnswers({ ...answers, 'Einzelgeschäftsführung': ans });
  }

  // 6) Kalkulations­funktionen
  function calcEBITMargin(y) {
    const rev  = parseNum(answers[`Umsatz ${y}`]);
    const ebit = parseNum(answers[`EBIT ${y}`]);
    return rev && ebit !== null
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

  // 7) Reihen-Definition mit Abhängigkeiten
  const rows = [
    { label:'Umsatz',           key:'Umsatz',         input:true,  show:()=>true         },
    { label:'CEO-Saläre',       key:'CEO-Saläre',     input:true,  show:()=>revC        },
    { label:'Abschreibungen',   key:'Abschreibungen', input:true,  show:()=>ceoC        },
    { label:'EBIT',             key:'EBIT',           input:true,  show:()=>absC        },
    { label:'EBIT-Marge',       key:'EBIT-Marge',     input:false, show:()=>ebitC       },
    { label:'EBIT Anpassung',   key:'EBIT Anpassung', input:true,  show:()=>ebitC       },
    { label:'EBIT angepasst',   key:'EBIT angepasst', input:false, show:()=>ebitC       },
    { label:'EBITC (EBIT+CEO)', key:'EBITC (EBIT+CEO)',input:false,show:()=>ebitC       }
  ].filter(r => r.show());

  // 8) Renderer
  function renderRow(r) {
    const { label, key, input } = r;
    const isOpen = openRow === key;

    // — Spezialfall CEO-Saläre **BEVOR** beantwortet —
    if (key==='CEO-Saläre' && revC && answers['Einzelgeschäftsführung']===undefined) {
      return e('tr',{ key:key+'-ask' },
        // linke Zelle, etwas breiter
        e('td',{ className:'bg-gray-100 px-2 py-1 w-56 select-none' },
          e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
            isOpen?'▼':'▶'
          ),
          e('span',{ className:'font-medium' },label)
        ),
        // rechte Zelle mit Frage (über alle Jahres-Spalten)
        e('td',{ colSpan:years.length, className:'bg-gray-50 px-2 py-2' },
          e('p',{ className:'italic text-gray-700 mb-1' },
            'Wird Ihr Unternehmen von genau einer Person geführt?'
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

    // — normale Zeile —
    const mainRow = e('tr',{ key },
      e('td',{ className:'bg-gray-100 px-2 py-1 w-56 select-none' },
        e('button',{ type:'button', onClick:()=>toggleRow(key), className:'mr-1' },
          isOpen?'▼':'▶'
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
                onKeyDown:ev=>{ if(ev.key==='Enter')ev.preventDefault(); },
                onFocus:()=>{ if(!isOpen) toggleRow(key); },
                onChange:ev=>setField(key,y,ev.target.value)
              })
            : e('span',{}, key==='EBIT-Marge'
                ? calcEBITMargin(y)
                : key==='EBIT angepasst'
                  ? calcAdjEBIT(y)
                  : key==='EBITC (EBIT+CEO)'
                    ? calcEBITC(y)
                    : ''
              )
          : null
      ))
    );

    // — Zusatz-Reihe: Frage dort **NACH** der Antwort im Unterbereich —
    if (key==='CEO-Saläre' && isOpen && revC && answers['Einzelgeschäftsführung']!==undefined) {
      const colspan = years.length + 1;
      const subRow = e('tr',{ key:key+'-sub' },
        e('td',{ colSpan:colspan, className:'px-2 py-2 bg-gray-50' },
          e('p',{ className:'italic text-gray-700 mb-1' },
            'Wird Ihr Unternehmen von genau einer Person geführt?'
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
      return [ mainRow, subRow ];
    }

    return mainRow;
  }

  // 9) Gesamttabelle rendern
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
