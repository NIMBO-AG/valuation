// src/form.js
function FormComponent() {
  const e = React.createElement;
  const [lang, setLang] = React.useState(new URLSearchParams(window.location.search).get('lang') || 'de');
  const [questions, setQuestions] = React.useState([]);
  const [translations, setTranslations] = React.useState({});
  const [answers, setAnswers] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const uuidRef = React.useRef(null);

  React.useEffect(() => {
    Promise.all([loadTranslations(), loadQuestions()])
      .then(([transData, qData]) => {
        setTranslations(transData[lang] || {});
        setQuestions(qData);
        const params = new URLSearchParams(window.location.search);
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

  const handleSubmit = eEvt => {
    eEvt.preventDefault();
    const myUuid = uuidRef.current;
    const link = `${window.location.origin}${window.location.pathname}?uid=${myUuid}`;
    const payload = { uuid: myUuid, lang, link, answers };
    setAnswers(answers);
    setLoading(true);
    fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    setLoading(false);
    window.location.search = '?uid=' + myUuid + '&lang=' + lang;
  };

  if (loading) {
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

  // Evaluate visibility
  const visibleQs = questions.filter(q => {
    if (!q.visible_if) return true;
    try {
      const cond = q.visible_if.replace(/(\w+)/g, 'answers.$1');
      return Function('answers', `return ${cond}`)(answers);
    } catch(e) {
      return true;
    }
  });

  if (uuidRef.current && Object.keys(answers || {}).length && !loading) {
    return e('div', {className:'text-center'},
      switcher,
      e('p', {}, translations.thankYou),
      e('a', {href: window.location.href, className:'text-blue-600 underline'}, window.location.href)
    );
  }

  return e('div', {},
    switcher,
    e('form', {onSubmit: handleSubmit, className: 'space-y-4'},
      visibleQs.map(q =>
        renderQuestion(q, answers[q.id] || (q.type==='checkbox'?[]:''), val =>
          setAnswers({...answers, [q.id]: val}),
        translations, lang)
      ),
      e('button', {type:'submit', className:'bg-blue-600 text-white px-4 py-2 rounded'},
        translations.submit
      )
    )
  );
}
