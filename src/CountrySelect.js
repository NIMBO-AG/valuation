// src/CountrySelect.js
function CountrySelect({ q, answer, onAnswer, translations, lang }) {
  const e = React.createElement;
  const [filter, setFilter] = React.useState('');
  const list = COUNTRIES[lang] || COUNTRIES['en'];
  const filtered = list
    .map(c => c.name)
    .filter(name => name.toLowerCase().includes(filter.toLowerCase()));
  return e('div', {},
    e('label', { className: 'block font-medium mb-1' }, translations[q.id] || q.text),
    e('input', {
      type: 'text',
      placeholder: translations['search'] || 'Search...',
      value: filter,
      onChange: ev => setFilter(ev.target.value),
      className: 'w-full border rounded p-2 mb-2'
    }),
    e('select', {
      value: answer,
      onChange: ev => onAnswer(ev.target.value),
      className: 'w-full border rounded p-2'
    },
      filtered.map(name => e('option', { key: name, value: name }, name))
    )
  );
}
