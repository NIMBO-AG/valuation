// src/languageSwitcher.js
function LanguageSwitcher({ currentLang, onChange }) {
  const e = React.createElement;
  return e('div', { className: 'mb-4' },
    e('label', { htmlFor: 'lang-select', className: 'block font-medium mb-1' }, 'Sprache / Language:'),
    e('select', {
      id: 'lang-select',
      value: currentLang,
      onChange: evt => onChange(evt.target.value),
      className: 'border rounded p-2'
    },
      e('option', { value: 'de' }, 'Deutsch'),
      e('option', { value: 'en' }, 'English')
    )
  );
}