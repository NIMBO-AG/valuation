// src/form.js

function FormComponent() {
  const e = React.createElement;
  const params = new URLSearchParams(window.location.search);

  // URL-Parameter
  const [lang, setLang] = React.useState(params.get('lang') || 'de');
  const valuationId     = params.get('uid');
  const isSubmitted     = params.get('submitted') === 'true';
  const freeCode        = params.get('free_code') || '';
  const updateMode      = Boolean(valuationId);
  const freeMode        = freeCode && freeCode !== '-';

  // App-State
  const [blocks, setBlocks]             = React.useState([]);
  const [translations, setTranslations] = React.useState({});
  const [answers, setAnswers]           = React.useState({});
  const [industries, setIndustries]     = React.useState([]);
  const [loading, setLoading]           = React.useState(true);
  const uuidRef                         = React.useRef(valuationId || null);

  // 1) Einmalig: Blocks, Übersetzungen & Industries laden & ggf. Prefill
  React.useEffect(() => {
    Promise.all([
      window.fetchBlocks(),
      window.fetchTranslationsCached(),
      window.fetchIndustriesCached()
    ]).then(([blockData, transData, industriesData]) => {
      setBlocks(blockData);
      setTranslations(transData[lang] || {});
      setIndustries(industriesData);

      if (valuationId && !isSubmitted) {
        // Update-Mode: Antworten vom Server holen
        window.fetchPrefill(valuationId, data => {
          const incoming = data.answers || {};
          const norm = {};
          Object.keys(incoming).forEach(key => {
            const val = incoming[key];
            norm[key] = (typeof val === 'string' && val.includes(','))
              ? val.split(/\s*,\s*/)
              : val;
          });
          setAnswers(norm);
          setLoading(false);
        });
      } else {
        // New-Mode: Neue UUID und fertig
        uuidRef.current = generateUUID();
        setLoading(false);
      }
    });
  }, []); // nur einmal beim Mount

  // 2) Übersetzungen neu laden, wenn sich lang ändert (lässt answers unberührt)
  React.useEffect(() => {
    window.fetchTranslationsCached()
      .then(transData => {
        setTranslations(transData[lang] || {});
      });
  }, [lang]);

  // 3) Geo-IP-Autofill für country nur einmal, wenn noch nicht gesetzt
  React.useEffect(() => {
    const countryBlock = blocks.find(b => b.type === 'country');
    if (!countryBlock) return;

    const key = countryBlock.key;
    if (answers[key]) return; // bereits gesetzt

    getCountryCodeByIP()
      .then(iso2 => {
        if (!iso2) return;
        const list  = COUNTRIES[lang] || COUNTRIES['de'];
        const match = list.find(c => c.code === iso2);
        if (match) {
          setAnswers(prev => ({ ...prev, [key]: match.code }));
        }
      })
      .catch(() => {/* ignore */});
  }, [blocks]);

  // Sprache wechseln
  function handleLangChange(newLang) {
    params.set('lang', newLang);
    window.history.replaceState(null, '', '?' + params.toString());
    setLang(newLang);
  }

  // Formular abschicken
  function handleSubmit(eEvt) {
    eEvt.preventDefault();
    const myValId = uuidRef.current;
    const link    = `${window.location.origin}${window.location.pathname}?uid=${myValId}`;
    const payload = {
      uuid:       myValId,
      lang,
      link,
      freeCode,
      updateMode: updateMode ? 'yes' : 'no',
      freeMode:   freeMode   ? 'yes' : 'no',
      answers
    };
    setLoading(true);
    window.postAnswers(payload, () => {
      params.set('uid', myValId);
      params.set('submitted', 'true');
      if (freeCode) params.set('free_code', freeCode);
      window.location.search = '?' + params.toString();
    });
  }

  // Loading-Zustand
  if (loading) {
    return e('p', {}, translations.loading || 'Lade…');
  }

  // Danke-Seite
  if (isSubmitted) {
    return e('div', { className: 'text-center' },
      e(LanguageSwitcher, { currentLang: lang, onChange: handleLangChange }),
      e('p', {}, translations.thankYou),
      e('a', {
        href: window.location.href.replace('&submitted=true', ''),
        className: 'text-blue-600 underline'
      }, window.location.href.replace('&submitted=true', ''))
    );
  }

  // Sprach-Switcher
  const switcher = e(LanguageSwitcher, { currentLang: lang, onChange: handleLangChange });

  // Sichtbare Blocks filtern
  const visibleBlocks = blocks
    .filter(b => b.key && b.key.trim())
    .filter(b => {
      // Update/Free Mode Regeln
      const um = b['Update Mode'] || '';
      if (updateMode && um === 'hide in update mode') return false;
      if (!updateMode && um === 'only in update mode') return false;
      const fm = b['Free Mode'] || '';
      if (freeMode && fm === 'hide in free mode') return false;
      if (!freeMode && fm === 'only in free mode') return false;
      // Visible If
      const condRaw = b['Visible If'];
      if (!condRaw) return true;
      try {
        const m = condRaw.trim().match(/^(\w+)\s*==\s*"(.+)"$/);
        if (m) return answers[m[1]] === m[2];
      } catch {
        console.warn('Invalid Visible If:', condRaw);
      }
      return true;
    });

  // Rendern
  return e('div', {},
    switcher,
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      visibleBlocks.map((b, idx) =>
        e(React.Fragment, { key: b.key || `block-${idx}` },
          renderQuestion(
            b,
            answers[b.key] || (b.type === 'checkbox' ? [] : ''),
            val => setAnswers({ ...answers, [b.key]: val }),
            translations,
            lang,
            answers,
            industries      // übergebe hier das industries-Array
          )
        )
      ),
      e('button', {
        type: 'submit',
        className: 'bg-blue-600 text-white px-4 py-2 rounded'
      }, translations.submit)
    )
  );
}

// Global registrieren, falls Dein Setup es erwartet:
window.FormComponent = FormComponent;
