// src/questionRenderer.js

import React from 'react';
import RegionMap from './RegionMap';
import { COUNTRIES } from './config';

/**
 * q:            Block-Definition aus Deinem Google Sheet
 * answer:       Aktueller Wert dieses Feldes
 * onAnswer:     Callback, um eine neue Antwort zu speichern
 * translations: Übersetzungs-Objekt für die aktuelle Sprache
 * lang:         Aktuelle Sprachkürzel ('de' oder 'en', o. Ä.)
 * allAnswers:   Alle bisherigen Antworten, z.B. für regionmap
 */
export default function renderQuestion(
  q,
  answer,
  onAnswer,
  translations,
  lang,
  allAnswers
) {
  const e = React.createElement;
  const labelText = translations[q.key] || q.text || '';

  // 1) Gemeinsames Options-Handling (select, radio, checkbox)
  const optionsKey = `${q.key} | Options`;
  const raw        = translations[optionsKey] || (q.options || []).join(';');
  const options    = raw.split(';').filter(opt => opt !== '');

  switch (q.type) {

    // ——— reiner Text-Block ——————————————————————————————
    case 'text':
      return e(
        'div',
        { className: 'mb-4' },
        e('p', {}, labelText)
      );

    // ——— Select-Dropdown ————————————————————————————————
    case 'select':
      return e(
        'div',
        {},
        e(
          'label',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        e(
          'select',
          {
            value: answer,
            onChange: ev => onAnswer(ev.target.value),
            className: 'w-full border rounded p-2'
          },
          options.map(opt =>
            e('option', { key: opt, value: opt }, opt)
          )
        )
      );

    // ——— Radio-Buttons ——————————————————————————————————
    case 'radio':
      return e(
        'div',
        {},
        e(
          'label',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        options.map(opt =>
          e(
            'div',
            { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type:    'radio',
              name:    q.key,
              value:   opt,
              checked: answer === opt,
              onChange: () => onAnswer(opt),
              className: 'mr-2'
            }),
            e('label', {}, opt)
          )
        )
      );

    // ——— Checkboxen ————————————————————————————————————
    case 'checkbox':
      const values = Array.isArray(answer)
        ? answer
        : answer
          ? answer.toString().split(/,\s*/)
          : [];
      return e(
        'div',
        {},
        e(
          'label',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        options.map(opt =>
          e(
            'div',
            { key: opt, className: 'flex items-center mb-1' },
            e('input', {
              type:    'checkbox',
              name:    q.key,
              value:   opt,
              checked: values.includes(opt),
              onChange: ev => {
                let newVals = [...values];
                if (ev.target.checked) newVals.push(opt);
                else newVals = newVals.filter(x => x !== opt);
                onAnswer(newVals);
              },
              className: 'mr-2'
            }),
            e('label', {}, opt)
          )
        )
      );

    // ——— Zahlenfeld mit Formatierung ————————————————————————
    case 'number':
      const formatted = formatNumber(answer);
      return e(
        'div',
        {},
        e(
          'label',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        e('input', {
          type:      'text',
          inputMode: 'numeric',
          value:     formatted,
          onChange:  ev => onAnswer(parseNumber(ev.target.value)),
          className: 'w-full border rounded p-2'
        })
      );

    // ——— Länderauswahl ————————————————————————————————————
    case 'country':
      // sortierte Liste nach übersetztem Label
      const list       = COUNTRIES.de;
      const sortedList = list.slice().sort((a, b) => {
        const la = translations[`country.${a.code}`] || a.name;
        const lb = translations[`country.${b.code}`] || b.name;
        return la.localeCompare(lb, lang);
      });
      const placeholder =
        translations['country.placeholder'] ||
        (lang === 'de' ? 'Bitte wählen' : 'Please select');

      return e(
        'div',
        {},
        e(
          'label',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        e(
          'select',
          {
            value: answer || '',
            onChange: ev => onAnswer(ev.target.value),
            className: 'w-full border rounded p-2'
          },
          e('option', { value: '', disabled: true }, placeholder),
          sortedList.map(c =>
            e(
              'option',
              { key: c.code, value: c.code },
              translations[`country.${c.code}`] || c.name
            )
          )
        )
      );

    // ——— Region-Map mit react-simple-maps —————————————————————
    case 'regionmap':
      // Wert des Country-Keys
      const countryCode = allAnswers['country'] || '';
      if (!countryCode) return null;
      return e(
        'div',
        { className: 'mb-4' },
        e(
          'p',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        e(RegionMap, { countryCode, onSelect: onAnswer })
      );

    // ——— Fallback: einfacher Text-Input —————————————————————
    default:
      return e(
        'div',
        {},
        e(
          'label',
          { className: 'block font-medium mb-1' },
          labelText
        ),
        e('input', {
          type:     'text',
          value:    answer,
          onChange: ev => onAnswer(ev.target.value),
          className:'w-full border rounded p-2'
        })
      );
  }
}
