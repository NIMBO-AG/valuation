// src/questionRenderer.js
function renderQuestion(q, answer, onAnswer, translations, lang) {
  const e = React.createElement;
  // Frage-Label aus Übersetzungen oder Fallback aus q.text
  const labelText = translations[q.key] || q.text;

  // Neue Logik: Optionen als eine Semikolon-Liste holen & in Array splitten
  const optionsKey = `${q.key} | Options`;
  const optionsRaw = translations[optionsKey] || (q.options || []).join(';');
  const options    = optionsRaw.split(';');

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
      // Wir laden immer die DE-Liste, exportieren auch DE-Namen.
      const list = COUNTRIES.de;
      // Placeholder-Text übersetzbar über Key "country.placeholder"
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
          list.map(c => {
            // Translation-Key z.B. "country.CH" oder "country.DE"
            const display = translations[`country.${c.code}`] || c.name;
            return e('option', { key: c.code, value: c.name }, display);
          })
        )
      );

    default:
      // Fallback: einfaches Textfeld
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
 
