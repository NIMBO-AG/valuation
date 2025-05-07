// src/questionRenderer.js
function renderQuestion(q, answer, onAnswer, translations, lang) {
  const e = React.createElement;
  const labelText = translations[q.id] || q.text;

  switch (q.type) {
    // ... bestehende Fälle für select, radio, checkbox, number, default

    case 'country':
      const list = COUNTRIES[lang] || COUNTRIES['en'];
      // Determine default country from navigator.language region
      const region = navigator.language.split('-')[1] || '';
      const defaultName = list.find(name => name.includes(region)) || list[0];
      const selected = answer || defaultName;
      return e('div', {},
        e('label', { className: 'block font-medium mb-1' }, labelText),
        e('input', {
          list: 'country-list-' + q.id,
          value: selected,
          onChange: ev => onAnswer(ev.target.value),
          placeholder: translations[q.id] || q.text,
          className: 'w-full border rounded p-2',
          type: 'text'
        }),
        e('datalist', { id: 'country-list-' + q.id },
          list.map(country =>
            e('option', { key: country, value: country }, country)
          )
        )
      );

    // ... andere Fälle
  }
}