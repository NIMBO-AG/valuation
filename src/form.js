// src/form.js
function FormComponent() {
  const e = React.createElement;
  const params = new URLSearchParams(window.location.search);
  const [lang, setLang] = React.useState(params.get('lang') || 'de');
  const valuationId = params.get('uid');
  const isSubmitted = params.get('submitted') === 'true';

  const [questions, setQuestions] = React.useState([]);
  const [translations, setTranslations] = React.useState({});
  const [answers, setAnswers] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const uuidRef = React.useRef(valuationId || null);

  React.useEffect(() => {
    Promise.all([fetchTranslationsCached(), fetchBlocks()])
      .then(async ([transData, qData]) => {
        setTranslations(transData[lang] || {});
        setQuestions(qData);

        if (valuationId && !isSubmitted) {
          fetchPrefill(valuationId, data => {
            const incoming = data.answers || {};
            const norm = {};
            Object.keys(incoming).forEach(key => {
              const val = incoming[key];
              norm[key] = (typeof val === 'string' && val.includes(',')) ? val.split(/\s*,\s*/) : val;
            });
            setAnswers(norm);
            setLoading(false);
          });
        } else {
          uuidRef.current = generateUUID();
          const countryQ = qData.find(q => q.type === 'country');
          if (countryQ) {
            try {
              const iso2 = await getCountryCodeByIP();
              if (iso2) {
                const list = COUNTRIES[lang] || COUNTRIES['en'];
                const match = list.find(c => c.code === iso2);
                if (match) {
                  setAnswers(prev => ({ ...prev, [countryQ.id]: match.name }));
                }
              }
            } catch {}
          }
          setLoading(false);
        }
      });
  }, [lang]);

  const handleSubmit = eEvt => {
    eEvt.preventDefault();
    const myValId = uuidRef.current;
    const link = `${window.location.origin}${window.location.pathname}?uid=${myValId}`;
    const payload = { uuid: myValId, lang, link, answers };
    setLoading(true);
    postAnswers(payload, () => {
      window.location.search = `?uid=${myValId}&lang=${lang}&submitted=true`;
    });
  };

  if (loading) return e('p', {}, translations.loading || 'Lade…');

  if (isSubmitted) {
    return e('div', { className: 'text-center' },
      e(LanguageSwitcher, {
        currentLang: lang,
        onChange: newLang => {
          params.set('lang', newLang);
          window.history.replaceState(null, '', '?' + params.toString());
          setLang(newLang);
        }
      }),
      e('p', {}, translations.thankYou),
      e('a', {
        href: window.location.href.replace('&submitted=true',''),
        className: 'text-blue-600 underline'
      }, window.location.href.replace('&submitted=true',''))
    );
  }

  const switcher = e(LanguageSwitcher, {
    currentLang: lang,
    onChange: newLang => {
      params.set('lang', newLang);
      window.history.replaceState(null, '', '?' + params.toString());
      setLang(newLang);
    }
  });

  const visibleQs = questions.filter(q => {
    if (!q.visible_if) return true;
    try {
      const cond = q.visible_if.trim();
      const match = cond.match(/^(\w+)\s*==\s*"(.+)"$/);
      if (match) {
        const field = match[1];
        const value = match[2];
        return answers[field] === value;
      }
    } catch (err) {
      console.warn("Invalid visible_if condition:", q.visible_if);
    }
    return true;
  });

  return e('div', {},
    switcher,
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      visibleQs.map(q => renderQuestion(
        q,
        answers[q.id] || (q.type==='checkbox'?[]:''),
        val => setAnswers({ ...answers, [q.id]: val }),
        translations,
        lang
      )),
      e('button', {
        type: 'submit',
        className: 'bg-blue-600 text-white px-4 py-2 rounded'
      }, translations.submit)
    )
  );
}
