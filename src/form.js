// src/form.js
function FormComponent() {
  const e = React.createElement;
  const [answer, setAnswer] = React.useState("");
  const [uuid, setUuid] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [translations, setTranslations] = React.useState(null);
  const uuidRef = React.useRef(null);
  const lang = navigator.language.startsWith('en') ? 'en' : 'de';

  React.useEffect(() => {
    // load translations first
    loadTranslations().then(trans => {
      setTranslations(trans);
      // then handle prefill/uuid
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      if (uid) {
        loadPrefill(uid, data => {
          if (!data.error && data.answers) {
            setAnswer(data.answers.branche || "");
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

  if (!translations || loading) return e("p", {}, translations ? "Lade… Antwort…" : "Lade Übersetzungen…");

  if (uuid) {
    const link = `${window.location.origin}${window.location.pathname}?uid=${uuid}`;
    return e("div", { className: "text-center" },
      e("p", {}, translations[lang].thankYou),
      e("a", { href: link, className: "text-blue-600 underline" }, link)
    );
  }

  return e("form", { onSubmit: handleSubmit, className: "space-y-4" },
    e("label", { className: "block font-medium" }, translations[lang].question),
    e("input", {
      type: "text",
      required: true,
      value: answer,
      onChange: ev => setAnswer(ev.target.value),
      className: "w-full border rounded p-2"
    }),
    e("button", { type: "submit", className: "bg-blue-600 text-white px-4 py-2 rounded" },
      translations[lang].submit
    )
  );
}