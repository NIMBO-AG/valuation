// src/form.js
function FormComponent() {
  const e = React.createElement;

  // 1) states
  const [lang, setLang] = React.useState(
    new URLSearchParams(window.location.search).get('lang') || 'de'
  );
  const [questions, setQuestions]       = React.useState([]);
  const [translations, setTranslations] = React.useState({});
  const [answers, setAnswers]           = React.useState({});
  const [loading, setLoading]           = React.useState(true);
  const uuidRef                          = React.useRef(null);

  // 2) Detect submission via uid query param
  const params      = new URLSearchParams(window.location.search);
  const isSubmitted = Boolean(params.get('uid'));

  // 3) Load translations + questions + optionally prefill
  React.useEffect(() => {
    Promise.all([loadTranslations(), loadQuestions()])
      .then(([transData, qData]) => {
        setTranslations(transData[lang] || {});
        setQuestions(qData);

        const uid = params.get('uid');
        if (uid) {
          loadPrefill(uid, data => {
            setAnswers(data.answers || {});
            uuidRef.current = data.uuid;
            setLoading(false);
          });
        } else {
          uuidRef.current = generateUUID();
          setLoading(false);
        }
      });
  }, [lang]);

  // 4) Handle form submit
  const handleSubmit = eEvt => {
    eEvt.preventDefault();
    const myUuid = uuidRef.current;
    const link   = `${window.location.origin}${window.location.pathname}?uid=${myUuid}`;
    const payload = { uuid: myUuid, lang, link, answers };
    setLoading(true);
    fetch(WEBHOOK_URL, {
      method: 'POST',
      mode:   'no-cors',
      headers:{ 'Content-Type':'application/json' },
      body:    JSON.stringify(payload)
    }).finally(() => {
      // After sending, reload with uid so we enter submitted-state
      window.location.search = `?uid=${myUuid}&lang=${lang}`;
    });
  };

  // 5) While loading translations/prefill/questions
  if (loading) {
    return e('p', {}, 'Lade…');
  }

  // 6) If submitted (we have a uid in the URL), show thank-you
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
        href: window.location.href,
        className: 'text-blue-600 underline'
      }, window.location.href)
    );
  }

  // 7) Filter visible questions
  const visibleQs = questions.filter(q => {
    if (!q.visible_if) return true;
    try {
      // simple eval on your German-ids, e.g. q.visible_if = 'q1=="Produktion"'
      return Function('answers', `return ${q.visible_if}`)(answers);
    } catch (err) {
      return true;
    }
  });

  // 8) Render form with all questions + submit button
  return e('div', {},
    e(LanguageSwitcher, {
      currentLang: lang,
      onChange: newLang => {
        params.set('lang', newLang);
        window.history.replaceState(null, '', '?' + params.toString());
        setLang(newLang);
      }
    }),
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      visibleQs.map(q =>
        renderQuestion(
          q,
          answers[q.id] || (q.type==='checkbox'?[]:''),
          val => setAnswers({ ...answers, [q.id]: val }),
          translations,
          lang
        )
      ),
      e('button', {
        type: 'submit',
        className: 'bg-blue-600 text-white px-4 py-2 rounded'
      }, translations.submit)
    )
  );
}
