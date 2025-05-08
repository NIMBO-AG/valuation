// src/form.js
function FormComponent() {
  // … (alle bisherigen Hooks und useEffect unverändert) …

  // Sichtbarkeits-Filter **UND** leere Keys herausnehmen:
  const visibleBlocks = blocks
    .filter(b => b.key && b.key.trim())     // BLOCKS MIT key="" IGNORIEREN
    .filter(b => {
      // Update/Free-Mode-Logik wie gehabt …
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
      } catch(e) { console.warn('Invalid Visible If:', condRaw); }
      return true;
    });

  return e('div', {},
    switcher,
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      visibleBlocks.map((b, idx) =>
        e(React.Fragment, { key: b.key || `block-${idx}` },
          renderQuestion(
            b,
            answers[b.key] || (b.type === 'checkbox' ? [] : ''),
            v => setAnswers({ ...answers, [b.key]: v }),
            translations,
            lang
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
