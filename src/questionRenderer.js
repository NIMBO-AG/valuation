// src/questionRenderer.js

function renderQuestion(
  q,
  answer,
  onAnswer,
  translations,
  lang,
  answers = {},
  industries = []
) {
  const e = React.createElement;

  // 1) Pull in the question text and optional instructions
  const labelText        = translations[q.key] || q.text || '';
  const instructionsText = q.instructions || '';

  // 2) Helper to emit the <label> and optional <p> below it
  function renderLabelAndInstructions() {
    const nodes = [
      e('label',
        {
          key: 'label',
          className: 'block font-medium mb-1',
          htmlFor: q.key
        },
        labelText
      )
    ];
    if (instructionsText) {
      nodes.push(
        e('p',
          {
            key: 'instr',
            className: 'text-sm text-gray-600 mb-2'
          },
          instructionsText
        )
      );
    }
    return nodes;
  }

  // 3) For select/radio/checkbox we need the options array
  const optionsKey = `${q.key} | Options`;
  const raw        = translations[optionsKey] || (q.options || []).join(';');
  const options    = raw.split(';').filter(o => o);

  switch (q.type) {
    // ────────────────────────────────────────────────
    // informational text only (no title wrapper)
    case 'text':
      return e('div', { className: 'mb-4' },
        e('p', {}, labelText)
      );

    // ────────────────────────────────────────────────
    // single-line text input
    case 'input':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('input', {
          id:       q.key,
          type:     'text',
          value:    answer || '',
          maxLength: 500,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );

    // ────────────────────────────────────────────────
    // dropdown select
    case 'select':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('select', {
          id:       q.key,
          value:    answer || '',
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        },
          e('option', { value: '', disabled: true },
            translations[`${q.key}.placeholder`] || '— bitte wählen —'
          ),
          options.map(opt =>
            e('option', { key: opt, value: opt }, opt)
          )
        )
      );

    // ────────────────────────────────────────────────
    // radio buttons (single choice)
    case 'radio':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        options.map(opt =>
          e('div', { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type:     'radio',
              name:     q.key,
              value:    opt,
              checked:  answer === opt,
              onChange: () => onAnswer(opt),
              className:'mr-2'
            }),
            e('label', {}, opt)
          )
        )
      );

    // ────────────────────────────────────────────────
    // checkboxes (multi-choice)
    case 'checkbox':
      const values = Array.isArray(answer)
        ? answer
        : (answer ? answer.toString().split(/,\s*/) : []);
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        options.map(opt =>
          e('div', { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type:     'checkbox',
              name:     q.key,
              value:    opt,
              checked:  values.includes(opt),
              onChange: ev => {
                const next = ev.target.checked
                  ? [...values, opt]
                  : values.filter(v => v !== opt);
                onAnswer(next);
              },
              className:'mr-2'
            }),
            e('label', {}, opt)
          )
        )
      );

    // ────────────────────────────────────────────────
    // number input
    case 'number':
      const formatted = formatNumber(answer);
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('input', {
          id:       q.key,
          type:     'text',
          inputMode:'numeric',
          value:    formatted,
          onChange: ev => onAnswer(parseNumber(ev.target.value)),
          className:'w-full border rounded p-2'
        })
      );

    // ────────────────────────────────────────────────
    // country select
    case 'country':
      {
        const list = COUNTRIES.de;
        const sorted = list.slice().sort((a,b) => {
          const A = translations[`country.${a.code}`]||a.name;
          const B = translations[`country.${b.code}`]||b.name;
          return A.localeCompare(B, lang);
        });
        const placeholder = translations['country.placeholder']
          || (lang==='de'?'Bitte wählen':'Please select');
        return e('div', { className:'mb-4' },
          ...renderLabelAndInstructions(),
          e('select', {
            id:       q.key,
            value:    answer||'',
            onChange: ev=>onAnswer(ev.target.value),
            className:'w-full border rounded p-2'
          },
            e('option',{value:'',disabled:true}, placeholder),
            sorted.map(c=> e('option',{key:c.code,value:c.code},
              translations[`country.${c.code}`]||c.name
            ))
          )
        );
      }

    // ────────────────────────────────────────────────
    // region delegated
    case 'region':
      return e(window.RegionSelect, { q, answer, onAnswer, translations, lang, answers });

    // ────────────────────────────────────────────────
    // industries delegated
    case 'industries':
      return e(window.IndustrySelect, {
        q, answer, onAnswer, translations, lang, answers, industries
      });

    // ────────────────────────────────────────────────
    // star rating
    case 'stars':
      return e('div',{className:'mb-4'},
        ...renderLabelAndInstructions(),
        e('div',{className:'flex space-x-1'},
          [1,2,3,4,5].map(n =>
            e('span',{
              key: n,
              className: `cursor-pointer text-2xl ${answer>=n?'text-yellow-400':'text-gray-300'}`,
              onClick: ()=>onAnswer(n)
            }, answer>=n?'★':'☆')
          )
        )
      );

    // ────────────────────────────────────────────────
    // fallback to text input
    default:
      return e('div',{className:'mb-4'},
        ...renderLabelAndInstructions(),
        e('input',{
          id:       q.key,
          type:     'text',
          value:    answer||'',
          maxLength:500,
          onChange: ev=>onAnswer(ev.target.value),
          className:'w-full border rounded p-2'
        })
      );
  }
}

window.renderQuestion = renderQuestion;
