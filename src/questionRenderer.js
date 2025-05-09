// src/questionRenderer.js

function renderQuestion(
  q,
  answer,
  onAnswer,
  translations,
  lang,
  answers = {},
  industries = [],
  setAnswers         // NEW: setter for multi-key updates
) {
  const e = React.createElement;
  const labelText        = translations[q.key] || q.text || '';
  const instructionsText = q.instructions || '';

  function renderLabelAndInstructions() {
    const parts = [
      e('label', {
        key: 'label',
        className: 'block font-medium mb-1',
        htmlFor: q.key
      }, labelText)
    ];
    if (instructionsText) {
      parts.push(
        e('p', {
          key: 'instr',
          className: 'text-sm text-gray-600 mb-2'
        }, instructionsText)
      );
    }
    return parts;
  }

  // split options
  const rawOpts = translations[`${q.key} | Options`] 
    || (q.options || []).join(';');
  const options = rawOpts.split(';').filter(o => o);

  switch (q.type) {

    // ... your existing cases for text, input, select, radio, checkbox, etc. ...

    // ─── radio-with-other ───────────────────────────────────────────────
    case 'radio-other': {
      // assume last option is the "Other" label
      const otherOption = options[options.length - 1];
      const normalOptions = options.slice(0, -1);
      // value of the free-text field is stored at key+"_other"
      const otherKey = `${q.key}_other`;
      const otherValue = answers[otherKey] || '';

      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        // render the normal radio choices
        normalOptions.map(opt =>
          e('div', { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type: 'radio',
              name: q.key,
              value: opt,
              checked: answer === opt,
              onChange: () => {
                // set main answer and clear any previous "other"
                setAnswers({
                  ...answers,
                  [q.key]: opt,
                  [otherKey]: ''
                });
              },
              className: 'mr-2'
            }),
            e('label', {}, opt)
          )
        ),
        // render the "Other" radio
        e('div', { key: otherOption, className: 'flex items-center mb-1' },
          e('input', {
            type: 'radio',
            name: q.key,
            value: otherOption,
            checked: answer === otherOption,
            onChange: () => {
              // select "Other" and clear previous free-text
              setAnswers({
                ...answers,
                [q.key]: otherOption,
                [otherKey]: ''
              });
            },
            className: 'mr-2'
          }),
          e('label', {}, otherOption)
        ),
        // if "Other" is selected, show a text input
        answer === otherOption
          ? e('input', {
              id: otherKey,
              type: 'text',
              placeholder: translations[`${q.key}.otherPlaceholder`]
                || (lang === 'de' ? 'Bitte angeben…' : 'Please specify…'),
              value: otherValue,
              onChange: ev => {
                setAnswers({
                  ...answers,
                  [q.key]: otherOption,
                  [otherKey]: ev.target.value
                });
              },
              className: 'w-full border rounded p-2 mt-1'
            })
          : null
      );
    }

    // ... your existing region, industries, stars, fallback cases ...
    default:
      // (keep your fallback text‐input case here)
      return e('div', { className: 'mb-4' },
        ...renderLabelAndInstructions(),
        e('input',{
          id: q.key,
          type: 'text',
          value: answer || '',
          maxLength: 500,
          onChange: ev => onAnswer(ev.target.value),
          className: 'w-full border rounded p-2'
        })
      );
  }
}

window.renderQuestion = renderQuestion;
