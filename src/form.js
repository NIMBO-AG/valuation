// src/form.js

function FormComponent() {
  const e = React.createElement;
  const params = new URLSearchParams(window.location.search);

  // URL‐Parameter & Modes
  const [lang, setLang]       = React.useState(params.get('lang') || 'de');
  const valuationId           = params.get('uid');
  const isSubmitted           = params.get('submitted') === 'true';
  const freeCode              = params.get('free_code') || '';
  const updateMode            = Boolean(valuationId);
  const freeMode              = freeCode && freeCode !== '-';

  // App-State
  const [blocks, setBlocks]             = React.useState([]);
  const [translations, setTranslations] = React.useState({});
  const [answers, setAnswers]           = React.useState({});
  const [industries, setIndustries]     = React.useState([]);
  const [loading, setLoading]           = React.useState(true);
  const uuidRef                         = React.useRef(valuationId || null);

  // 1) Blocks, Translations, Industries & Prefill laden
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
        window.fetchPrefill(valuationId, data => {
          const incoming = data.answers || {};
          const norm     = {};
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
        uuidRef.current = generateUUID();
        setLoading(false);
      }
    });
  }, []); // nur einmal

  // 2) Translations neu laden bei lang-Wechsel
  React.useEffect(() => {
    window.fetchTranslationsCached().then(transData => {
      setTranslations(transData[lang] || {});
    });
  }, [lang]);

  // 3) Geo-IP Autofill für country
  React.useEffect(() => {
    const countryBlock = blocks.find(b => b.type === 'country');
    if (!countryBlock) return;
    const key = countryBlock.key;
    if (answers[key]) return;
    getCountryCodeByIP()
      .then(iso2 => {
        if (!iso2) return;
        const list  = COUNTRIES[lang] || COUNTRIES['de'];
        const match = list.find(c => c.code === iso2);
        if (match) {
          setAnswers(prev => ({ ...prev, [key]: match.code }));
        }
      })
      .catch(() => {});
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

  // Hilfsfunktion: findet Leaf mit code === sel
  function findIndustryLeaf(nodes, sel) {
    for (const n of nodes) {
      if (n.code === sel) return n;
      if (n.children) {
        const found = findIndustryLeaf(n.children, sel);
        if (found) return found;
      }
    }
    return null;
  }

  // Blocks filtern
  const visibleBlocks = blocks
    .filter(b => b.key && b.key.trim())
    .filter(b => {
      // Update Mode
      const um = b['Update Mode'] || '';
      if (updateMode && um === 'hide in update mode') return false;
      if (!updateMode && um === 'only in update mode') return false;
      // Free Mode
      const fm = b['Free Mode'] || '';
      if (freeMode && fm === 'hide in free mode') return false;
      if (!freeMode && fm === 'only in free mode') return false;
      // Visible If (now supports spaces in key)
      const cond = b['Visible If'];
      if (!cond) return true;
      try {
        // capture everything before == as the key
        const m = cond.trim().match(/^(.+?)\s*==\s*"(.+)"$/);
        if (m) {
          const key = m[1].trim();
          const val = m[2];
          return answers[key] === val;
        }
      } catch {}
      return true;
    })
    // Region nur wenn Daten vorhanden
    .filter(b => {
      if (b.type === 'region') {
        const country = answers['Hauptsitz der Firma'] || '';
        const opts    = (window.regionData && window.regionData[country]) || [];
        return opts.length > 0;
      }
      return true;
    })
    // Industry-Tag-Logik
    .filter(b => {
      const raw = b['Industry Tag'] || '';
      if (!raw.trim()) return true;
      const blockTags = raw.split(';').map(t => t.trim()).filter(t => t);
      if (blockTags.length === 0) return true;
      const sel = answers['Selected Industry'];
      if (!sel) return false;
      const leaf = findIndustryLeaf(industries, sel);
      if (!leaf || !leaf.tags) return false;
      return blockTags.some(tag => leaf.tags.includes(tag));
    });

  // Rendern & Null-Filter
  const formElements = visibleBlocks
    .map((b, idx) => {
      const el = renderQuestion(
        b,
        answers[b.key] || (b.type === 'checkbox' ? [] : ''),
        val => setAnswers({ ...answers, [b.key]: val }),
        translations,
        lang,
        answers,
        industries,
        setAnswers // for radio-other
      );
      return el ? e(React.Fragment, { key: b.key || `blk-${idx}` }, el) : null;
    })
    .filter(x => x);

  return e('div', {}, switcher,
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      ...formElements,
      e('button', {
        type: 'submit',
        className: 'bg-blue-600 text-white px-4 py-2 rounded'
      }, translations.submit)
    )
  );
}

window.FormComponent = FormComponent;

// Vorschau bei Bedarf einfügen
React.useEffect(() => {
  const relevant = blocks.some(b => b.type && b.type.startsWith('fin'));
  if (relevant && !document.querySelector('#pl-preview')) {
    const html = window.renderPLPreview();
    document.body.insertAdjacentHTML('beforeend', html);
  }
}, [blocks]);

