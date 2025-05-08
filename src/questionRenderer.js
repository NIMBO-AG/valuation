// src/questionRenderer.js
function renderQuestion(q, answer, onAnswer, translations, lang) {
  const e = React.createElement;
  // labelText holt sich jetzt den Wert über q.key statt q.id
  const labelText = translations[q.key] || q.text;

  switch (q.type) {
    case 'text':
      // reiner Text-Block ohne Eingabe
      return e('div', { className: 'mb-4' },
        e('p', {}, q.text)
      );

    case 'select':
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('select', {
          value: answer,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        },
          q.options.map(opt =>
            // auch hier Übersetzungs-Key mit q.key
            e('option', { key: opt, value: opt }, translations[q.key + '_' + opt] || opt)
          )
        )
      );

    case 'radio':
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        q.options.map(opt =>
          e('div', { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type: 'radio',
              name: q.key,
              value: opt,
              checked: answer === opt,
              onChange: () => onAnswer(opt),
              className: 'mr-2'
            }),
            e('label', {}, translations[q.key + '_' + opt] || opt)
          )
        )
      );

    case 'checkbox':
      const values = Array.isArray(answer)
        ? answer : (answer ? answer.toString().split(/,\s*/) : []);
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        q.options.map(opt =>
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
            e('label', {}, translations[q.key + '_' + opt] || opt)
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
      const placeholder = lang === 'de' ? 'Bitte wählen' : 'Please select';
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('select', {
          value: answer || '',
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        },
          e('option', { value: '', disabled: true }, placeholder),
          list.map(c =>
            e('option', { key: c.code, value: c.name }, c.name)
          )
        )
      );

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
