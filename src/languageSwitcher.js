// src/languageSwitcher.js
function LanguageSwitcher({ currentLang, onChange }) {
  const e = React.createElement;
  const [open, setOpen] = React.useState(false);
  const flags = { de: '🇩🇪', en: '🇬🇧' };

  return e('div', { className: 'absolute top-2 right-2' },
    e('button', {
      onClick: () => setOpen(!open),
      className: 'text-2xl focus:outline-none'
    }, flags[currentLang]),
    open && e('div', {
      className: 'absolute right-0 mt-1 bg-white border rounded shadow'
    },
      Object.keys(flags).map(langKey =>
        e('button', {
          key: langKey,
          onClick: () => { onChange(langKey); setOpen(false); },
          className: 'block px-2 py-1 text-2xl focus:outline-none'
        }, flags[langKey])
      )
    )
  );
}
