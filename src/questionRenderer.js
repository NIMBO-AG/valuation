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

  // Common values
  const labelText        = translations[q.key] || q.text || '';
  const instructionsText = q.instructions || '';
  const optionsKey       = `${q.key} | Options`;
  const raw              = translations[optionsKey] || (q.options || []).join(';');
  const options          = raw.split(';').filter(opt => opt !== '');

  // Renders label + optional instructions under it
  function renderLabelAndInstructions() {
    const children = [
      e('label', { className: 'block font-medium mb-1', htmlFor: q.key }, labelText)
    ];
    if (instructionsText) {
      children.push(
        e('p', { className: 'text-sm text-gray-600 mb-2' }, instructionsText)
      );
    }
    return children;
  }

  switch (q.type) {
    // ─── informational paragraph, no title ────────────────────────────────
    case 'text':
      return e('div', { className: 'mb-4' },
        e('p', {}, labelText)
      );

    // ─── single‐line text input with maxLength ─────────────────────────────
    case 'input':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('input', {
          id: q.key,
          type: 'text',
          value: answer || '',
          maxLength: 500,  // limit to ~5 sentences worth of chars
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );

    // ─── dropdown select ───────────────────────────────────────────────────
    case 'select':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('select', {
          id: q.key,
          value: answer || '',
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

    // ─── radio buttons ────────────────────────────────────────────────────
    case 'radio':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        options.map(opt =>
          e('div', { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type: 'radio',
              name: q.key,
              value: opt,
              checked: answer === opt,
              onChange: () => onAnswer(opt),
              className: 'mr-2'
            }),
            e('label', {}, opt)
          )
        )
      );

    // ─── checkboxes ────────────────────────────────────────────────────────
    case 'checkbox':
      const values = Array.isArray(answer)
        ? answer
        : (answer ? answer.toString().split(/,\s*/) : []);
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        options.map(opt =>
          e('div', { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type: 'checkbox',
              name: q.key,
              value: opt,
              checked: values.includes(opt),
              onChange: ev => {
                let newVals = [...values];
                if (ev.target.checked) newVals.push(opt);
                else newVals = newVals.filter(x => x !== opt);
                onAnswer(newVals);
              },
              className: 'mr-2'
            }),
            e('label', {}, opt)
          )
        )
      );

    // ─── numeric input ─────────────────────────────────────────────────────
    case 'number':
      const formatted = formatNumber(answer);
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('input', {
          id: q.key,
          type: 'text',
          inputMode: 'numeric',
          value: formatted,
          onChange: ev => onAnswer(parseNumber(ev.target.value)),
          className: 'w-full border rounded p-2'
        })
      );

    // ─── country dropdown ───────────────────────────────────────────────────
    case 'country':
      {
        const list = COUNTRIES.de;
        const sortedList = list.slice().sort((a, b) => {
          const la = translations[`country.${a.code}`] || a.name;
          const lb = translations[`country.${b.code}`] || b.name;
          return la.localeCompare(lb, lang);
        });
        const placeholderC = translations['country.placeholder']
          || (lang === 'de' ? 'Bitte wählen' : 'Please select');
        return e('div', { className: 'mb-4' },
          ...renderLabelAndInstructions(),
          e('select', {
            id: q.key,
            value: answer || '',
            onChange: ev => onAnswer(ev.target.value),
            className: 'w-full border rounded p-2'
          },
            e('option', { value: '', disabled: true }, placeholderC),
            sortedList.map(c =>
              e('option', { key: c.code, value: c.code },
                translations[`country.${c.code}`] || c.name
              )
            )
          )
        );
      }

    // ─── region dropdown ────────────────────────────────────────────────────
    case 'region':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e(window.RegionSelect, { q, answer, onAnswer, translations, lang, answers })
      );

    // ─── industries tree ────────────────────────────────────────────────────
    case 'industries':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e(window.IndustrySelect, {
          q, answer, onAnswer, translations, lang, answers, industries
        })
      );

    // ─── stars rating ───────────────────────────────────────────────────────
    case 'stars':
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('div', { className: 'flex space-x-1' },
          [1,2,3,4,5].map(n =>
            e('span', {
              key: n,
              className: [
                'cursor-pointer',
                'text-2xl',
                answer >= n ? 'text-yellow-400' : 'text-gray-300'
              ].join(' '),
              onClick: () => onAnswer(n)
            }, answer >= n ? '★' : '☆')
          )
        )
      );

    // ─── fallback to single-line text input if type unknown ────────────────
    default:
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('input', {
          id: q.key,
          type: 'text',
          value: answer || '',
          maxLength: 500,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );
  }
}

window.renderQuestion = renderQuestion;
