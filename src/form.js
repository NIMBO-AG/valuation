// src/form.js
function FormComponent() {
  const e = React.createElement;
  const [lang, setLang] = React.useState(
    new URLSearchParams(window.location.search).get('lang') || 'de'
  );
  const [translations, setTranslations] = React.useState(null);
  const [answer, setAnswer] = React.useState('');
  const [uuid, setUuid] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const uuidRef = React.useRef(null);

  React.useEffect(() => {
    loadTranslations().then(trans => {
      setTranslations(trans);
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      if (uid) {
        loadPrefill(uid, data => {
          if (!data.error && data.answers) {
            setAnswer(data.answers.branche || '');
            uuidRef.current = data.uuid;
          }
          setLoading(false);
        });
      } else {
        uuidRef.current = generateUUID();
        setLoading(false);
      }
    });
  }, []);

  const handleSubmit = eEvt => {
    eEvt.preventDefault();
    const myUuid = uuidRef.current;
    const link = `${window.location.origin}${window.location.pathname}?uid=${myUuid}`;
    setUuid(myUuid);
    const payload = { uuid: myUuid, lang, link, answers: { branche: answer } };
    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  if (!translations || loading) {
    return e('p', {}, 'Lade…');
  }

  const switcher = e(LanguageSwitcher, {
    currentLang: lang,
    onChange: newLang => {
      setLang(newLang);
      const params = new URLSearchParams(window.location.search);
      params.set('lang', newLang);
      window.history.replaceState(null, '', '?' + params.toString());
    }
  });

  if (uuid) {
    return e('div', { className: 'text-center' },
      switcher,
      e('p', {}, translations[lang].thankYou),
      e('a', { href: window.location.href, className: 'text-blue-600 underline' }, window.location.href)
    );
  }

  return e('div', {},
    switcher,
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      e('label', { className: 'block font-medium' }, translations[lang].question),
      e('input', {
        type: 'text', required: true,
        value: answer,
        onChange: ev => setAnswer(ev.target.value),
        className: 'w-full border rounded p-2'
      }),
      e('button', { type: 'submit', className: 'bg-blue-600 text-white px-4 py-2 rounded' },
        translations[lang].submit
      )
    )
  );
}