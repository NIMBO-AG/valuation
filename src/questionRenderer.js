// src/questionRenderer.js
function renderQuestion(q, answer, onAnswer, translations, lang) {
  const e = React.createElement;
  const labelText = translations[q.id] || q.text;

  switch (q.type) {
    // ... other cases remain unchanged ...

    case 'country':
      // Use CountrySelect component for searchable dropdown
      return e(CountrySelect, { q, answer, onAnswer, translations, lang });

    default:
      // default text input
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
