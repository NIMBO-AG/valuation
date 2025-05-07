// src/questionRenderer.js
function renderQuestion(q, answer, onAnswer, translations, lang) {
  const e = React.createElement;
  const labelText = translations[q.id] || q.text;
  switch (q.type) {
    case 'select':
      return e('div', {},
        e('label', {}, labelText),
        e('select', {
          value: answer,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        },
          q.options.map(opt =>
            e('option', { key: opt, value: opt }, translations[q.id + '_' + opt] || opt)
          )
        )
      );
    case 'radio':
      return e('div', {},
        e('label', {}, labelText),
        q.options.map(opt =>
          e('div', { key: opt },
            e('label', {},
              e('input', {
                type: 'radio',
                name: q.id,
                value: opt,
                checked: answer === opt,
                onChange: () => onAnswer(opt),
                className: 'mr-2'
              }),
              translations[q.id + '_' + opt] || opt
            )
          )
        )
      );
    case 'checkbox':
      return e('div', {},
        e('label', {}, labelText),
        q.options.map(opt =>
          e('div', { key: opt },
            e('label', {},
              e('input', {
                type: 'checkbox',
                name: q.id,
                value: opt,
                checked: Array.isArray(answer) && answer.includes(opt),
                onChange: ev => {
                  const checked = ev.target.checked;
                  const val = ev.target.value;
                  if (checked) onAnswer([...(answer||[]), val]);
                  else onAnswer((answer||[]).filter(x => x !== val));
                },
                className: 'mr-2'
              }),
              translations[q.id + '_' + opt] || opt
            )
          )
        )
      );
    case 'number':
      return e('div', {},
        e('label', {}, labelText),
        e('input', {
          type: 'number',
          value: answer,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );
    default:
      return e('div', {},
        e('label', {}, labelText),
        e('input', {
          type: 'text',
          value: answer,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );
  }
}
