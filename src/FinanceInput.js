// src/FinanceInput.js

(function(){
  const { useState, useEffect } = React;

  // Hilfsfunktionen für Formatierung
  function formatNum(x) {
    if (x == null || x === '') return '';
    const n = Number(x);
    if (isNaN(n)) return '';
    return n.toLocaleString('de-CH');
  }
  function parseNum(val) {
    if (val == null) return '';
    const cleaned = val.toString().replace(/\./g, '').replace(/,/g, '.');
    const f = parseFloat(cleaned);
    return isNaN(f) ? '' : f;
  }

  function FinanceInput({ answers, setAnswers }) {
    const e = React.createElement;
    const yearsAll = [2023, 2024, 2025];
    // 1) Ausgewählte Jahre (default alle)
    const selectedYears = answers['Finance Years'] || yearsAll;
    useEffect(() => {
      if (!answers['Finance Years']) {
        setAnswers({ ...answers, 'Finance Years': yearsAll });
      }
    }, []);

    function toggleYear(y) {
      const arr = answers['Finance Years'] || [];
      const upd = arr.includes(y)
        ? arr.filter(z => z !== y)
        : [...arr, y];
      setAnswers({ ...answers, 'Finance Years': upd });
    }

    // 2) Block-Expansion (nur einer offen)
    const [openBlock, setOpenBlock] = useState('Umsatz');

    function open(key) {
      setOpenBlock(key);
    }

    // 3) CEO-Sequenz-Logik
    const multiple = answers['MultipleCEOs'];       // "Ja" | "Nein"
    const countCEO = answers['CEO Count'];          // Zahl
    const stepCEO = (() => {
      if (multiple === undefined)       return 'question';
      if (multiple === 'Ja' && !countCEO) return 'count';
      return 'salary';
    })();

    // 4) Helfer für Eingaben
    function onChange(key, year, raw) {
      const num = parseNum(raw);
      setAnswers({ ...answers, [`${key} ${year}`]: num });
    }
    function onAnswer(key, val) {
      setAnswers({ ...answers, [key]: val });
    }

    // 5) Berechnungen
    function calcMargin(y) {
      const rev = answers[`Umsatz ${y}`] || 0;
      const ebt = answers[`EBIT ${y}`]   || 0;
      return rev > 0 ? Math.round((ebt / rev) * 100) + '%' : '';
    }

    // Aufbau: Tabelle mit Kopf + Körper
    return e('div', { className: 'space-y-4' },
      // ─── Jahr-Auswahl ─────────────────────────────────────────────
      e('div', {},
        e('label', { className: 'font-medium' }, 'Welche Jahre sollen berücksichtigt werden?'),
        e('div', { className: 'flex gap-4 mt-1' },
          yearsAll.map(y =>
            e('label', { key: y, className: 'flex items-center gap-1' },
              e('input', {
                type:     'checkbox',
                checked:  selectedYears.includes(y),
                onChange: () => toggleYear(y)
              }),
              y
            )
          )
        )
      ),

      // ─── P&L Tabelle ─────────────────────────────────────────────
      e('table', { className: 'w-full table-auto border-collapse text-sm' },
        // Kopfzeile
        e('thead', {
          className: 'bg-gray-100'
        }, e('tr', {},
          e('th', { className: 'px-2 py-1 text-left' }, 'Posten'),
          selectedYears.map(y =>
            e('th', { key: y, className: 'px-2 py-1' }, y)
          )
        )),
        // Körper
        e('tbody', {},
          // Umsatz-Block
          eRow('Umsatz',
            stepCheck('Umsatz'),
            selectedYears.map(y => inputCell('Umsatz', y)),
            e('tr', {}, e('td', {
              colSpan: 1 + selectedYears.length,
              className: 'px-2 py-1 italic text-gray-600 text-sm'
            }, 'Jahresumsatz in CHF (ohne MwSt).'))
          ),

          // CEO-Block
          eRow('CEO-Saläre',
            stepCheck('CEO-Saläre'),
            // je nach Step verschiedene Inhalte:
            (stepCEO === 'question') ? e('tr', { key:'q', className:'!bg-white' },
              e('td',{ colSpan:1 + selectedYears.length, className:'px-2 py-2 text-gray-700 italic' },
                'Wird Ihr Unternehmen von mehreren aktiven Geschäftsführer:innen oder Partner:innen geführt? ' +
                'Bei „Nein“ erfolgt die Eingabe eines einzigen Salärs.'
              ),
              e('td',{ colSpan:1 + selectedYears.length, className:'px-2 pb-2' },
                e('div',{ className:'flex gap-4' },
                  ['Nein','Ja'].map(opt =>
                    e('label',{ key:opt, className:'flex items-center gap-1' },
                      e('input',{ type:'radio',
                        name:'MultipleCEOs',
                        checked: multiple===opt,
                        onChange: ()=> onAnswer('MultipleCEOs', opt)
                      }),
                      opt
                    )
                  )
                )
              )
            )
            : (stepCEO === 'count') ? e('tr',{ key:'c', className:'!bg-white' },
              e('td',{ colSpan:1 + selectedYears.length, className:'px-2 py-2 text-gray-700 italic' },
                'Wie viele Geschäftsführer:innen/Partner:innen sind es insgesamt?'
              ),
              e('td',{ colSpan:1 + selectedYears.length, className:'px-2 pb-2' },
                e('input',{
                  type:'number',
                  min:1,
                  value: countCEO || '',
                  onChange: ev => onAnswer('CEO Count', parseInt(ev.target.value) || ''),
                  className:'w-24 border rounded p-1'
                })
              )
            )
            : // stepCEO === 'salary'
              selectedYears.map(y => inputCell('CEO-Saläre', y))
          ),

          // EBIT-Block
          eRow('EBIT',
            stepCheck('EBIT'),
            selectedYears.map(y => inputCell('EBIT', y))
          ),

          // EBIT-Marge
          eSimpleRow('EBIT-Marge',
            selectedYears.map(y => e('td',{ key:y, className:'px-2 py-1' }, calcMargin(y) ))
          )
        )
      )
    );

    // ─── Hilfs-Renderer ────────────────────────────────────────────

    function stepCheck(key) {
      return e('td', {
        className: 'px-2 py-1 cursor-pointer',
        onClick:   () => open(key)
      }, e('span', {
        className: 'inline-block transform ' +
          (openBlock === key ? 'rotate-90' : 'rotate-0')
      }, '▶'));
    }

    function inputCell(metric, year) {
      const val = answers[`${metric} ${year}`] ?? '';
      return e('td', { key: year, className: 'px-1 py-1' },
        openBlock === metric
          ? e('input', {
              type:      'text',
              inputMode: 'numeric',
              onKeyDown: ev => ev.key === 'Enter' && ev.preventDefault(),
              value:     formatNum(val),
              onChange:  ev => onChange(metric, year, ev.target.value),
              className: 'w-full border rounded px-1 py-1 text-right'
            })
          : null
      );
    }

    function eRow(metric, toggleTd, ...children) {
      return e(React.Fragment, { key: metric },
        e('tr', { className: 'bg-gray-50' },
          toggleTd,
          children.length ? children[0].props.children.map((td,i)=>
            // children[0] in this usage is array of tds
            td
          ) : null
        )
      );
    }

    function eSimpleRow(label, cells) {
      return e('tr', { key: label, className:'!bg-white' },
        e('td',{ className:'px-2 py-1 italic text-gray-600' }, label),
        ...cells
      );
    }
  }

  window.FinanceInput = FinanceInput;
})();
