// src/questionRenderer.js
function renderQuestion(q, answer, onAnswer, translations, lang) {
  const e = React.createElement;

  // 1) Label/Text fürs gesamte Element
  //    zuerst Key-Übersetzung, dann q.text
  const labelText = translations[q.key] || q.text || '';

  // 2) Optionen – immer als eine Semikolon-Liste in "<Key> | Options"
  const optionsKey = `${q.key} | Options`;
  const raw = translations[optionsKey] || (q.options || []).join(';');
  const options = raw.split(';').filter(opt => opt !== '');

  switch (q.type) {
    case 'text':
      // reiner Paragraph, übersetzbar über q.key
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
      // wir brauchen nur die Codes aus COUNTRIES.de, das Label kommt aus translations
      const codes = COUNTRIES.de.map(c => c.code);
      const placeholder = translations['country.placeholder']
        || (lang === 'de' ? 'Bitte wählen' : 'Please select');
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('select', {
          value: answer || '',
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        },
          e('option', { value: '', disabled: true }, placeholder),
          codes.map(code =>
            e('option', { key: code, value: code },
              translations[`country.${code}`] || code
            )
          )
        )
      );

    default:
      // alle anderen Fälle: einfaches Text-Input, Label wie oben
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
