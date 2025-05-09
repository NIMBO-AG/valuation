// src/questionRenderer.js

function renderQuestion(
  q,
  answer,
  onAnswer,
  translations,
  lang,
  answers = {}           // Default, falls vergessen
) {
  const e = React.createElement;
  const labelText = translations[q.key] || q.text || '';
  const optionsKey = `${q.key} | Options`;
  const raw = translations[optionsKey] || (q.options || []).join(';');
  const options = raw.split(';').filter(opt => opt !== '');

  switch (q.type) {
    case 'text':
      return e('div', { className: 'mb-4' },
        e('p', {}, labelText)
      );

    case 'select':
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('select', {
          value: answer,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        },
          options.map(opt =>
            e('option', { key: opt, value: opt }, opt)
          )
        )
      );

    case 'radio':
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
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

    case 'checkbox':
      const values = Array.isArray(answer)
        ? answer
        : (answer ? answer.toString().split(/,\s*/) : []);
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
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

    case 'number':
      const formatted = formatNumber(answer);
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('input', {
          type: 'text',
          inputMode: 'numeric',
          value: formatted,
          onChange: ev => onAnswer(parseNumber(ev.target.value)),
          className: 'w-full border rounded p-2'
        })
      );

    case 'country':
      const list = COUNTRIES.de;
      const sortedList = list.slice().sort((a, b) => {
        const labelA = translations[`country.${a.code}`] || a.name;
        const labelB = translations[`country.${b.code}`] || b.name;
        return labelA.localeCompare(labelB, lang);
      });
      const placeholderC = translations['country.placeholder']
        || (lang === 'de' ? 'Bitte wählen' : 'Please select');
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('select', {
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

    case 'region':
      // nutzt nun die ausgelagerte Komponente
      return e(window.RegionSelect, {
        q,
        answer,
        onAnswer,
        translations,
        lang,
        answers
      });

    default:
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('input', {
          type: 'text',
          value: answer,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );
  }
}

window.renderQuestion = renderQuestion;
