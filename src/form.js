// src/form.js
(function(){
  // FormComponent als globale Funktion
  function FormComponent() {
    const e = React.createElement;
    const params      = new URLSearchParams(window.location.search);
    const [lang, setLang]       = React.useState(params.get('lang') || 'de');
    const valuationId            = params.get('uid');
    const isSubmitted            = params.get('submitted') === 'true';
    const freeCode               = params.get('free_code') || '';
    const updateMode             = Boolean(valuationId);
    const freeMode               = freeCode && freeCode !== '-';
  
    const [blocks, setBlocks]             = React.useState([]);
    const [translations, setTranslations] = React.useState({});
    const [answers, setAnswers]           = React.useState({});
    const [loading, setLoading]           = React.useState(true);
    const uuidRef                         = React.useRef(valuationId || null);
  
    React.useEffect(() => {
      Promise.all([
        fetchTranslationsCached(),
        fetchBlocks()
      ]).then(([transData, blockData]) => {
        setTranslations(transData[lang] || {});
        setBlocks(blockData);
  
        if (valuationId && !isSubmitted) {
          // Prefill im Update-Mode
          fetchPrefill(valuationId, data => {
            const incoming = data.answers || {};
            const norm = {};
            Object.keys(incoming).forEach(key => {
              const v = incoming[key];
              norm[key] = (typeof v === 'string' && v.includes(','))
                ? v.split(/\s*,\s*/) 
                : v;
            });
            setAnswers(norm);
            setLoading(false);
          });
        } else {
          // Neues Formular
          uuidRef.current = generateUUID();
          // Geo-IP default Country
          const countryBlock = blockData.find(b => b.type === 'country');
          if (countryBlock) {
            getCountryCodeByIP()
              .then(iso2 => {
                if (!iso2) return;
                const list = window.COUNTRIES[lang] || window.COUNTRIES.en;
                const m = list.find(c => c.code === iso2);
                if (m) {
                  setAnswers(prev => ({
                    ...prev,
                    [countryBlock.key]: m.code
                  }));
                }
              })
              .catch(() => {});
          }
          setLoading(false);
        }
      });
    }, [lang]);
  
    const handleSubmit = eEvt => {
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
      postAnswers(payload, () => {
        params.set('uid', myValId);
        params.set('submitted', 'true');
        if (freeCode) params.set('free_code', freeCode);
        window.location.search = '?' + params.toString();
      });
    };
  
    if (loading) {
      return e('p', {}, translations.loading || 'Lade…');
    }
  
    if (isSubmitted) {
      return e('div', { className: 'text-center' },
        e(window.LanguageSwitcher, {
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
  
    const switcher = e(window.LanguageSwitcher, {
      currentLang: lang,
      onChange: newLang => {
        params.set('lang', newLang);
        window.history.replaceState(null, '', '?' + params.toString());
        setLang(newLang);
      }
    });
  
    // Filter: nur Blocks mit key + Update/Free/Visible If
    const visibleBlocks = blocks
      .filter(b => b.key && b.key.trim())
      .filter(b => {
        const um = b['Update Mode'] || '';
        if (updateMode) {
          if (um === 'hide in update mode') return false;
        } else if (um === 'only in update mode') {
          return false;
        }
        const fm = b['Free Mode'] || '';
        if (freeMode) {
          if (fm === 'hide in free mode') return false;
        } else if (fm === 'only in free mode') {
          return false;
        }
        const condRaw = b['Visible If'];
        if (!condRaw) return true;
        try {
          const m = condRaw.trim().match(/^(\w+)\s*==\s*"(.+)"$/);
          if (m) return answers[m[1]] === m[2];
        } catch (err) {
          console.warn('Invalid Visible If:', condRaw);
        }
        return true;
      });
  
    return e('div', {},
      switcher,
      e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
        visibleBlocks.map((b, idx) =>
          e(React.Fragment, { key: b.key || `block-${idx}` },
            window.renderQuestion(
              b,
              answers[b.key] || (b.type === 'checkbox' ? [] : ''),
              v => setAnswers({ ...answers, [b.key]: v }),
              translations,
              lang,
              answers
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
  
  // global verfügbar machen
  window.FormComponent = FormComponent;
})();
