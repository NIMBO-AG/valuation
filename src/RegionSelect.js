// src/RegionSelect.js

/**
 * Hard-coded Liste der Regionen pro Land.
 * Country-Codes wie im CountrySelect: DE, AT, IT, US, UK
 */
const regionData = {
  DE: [
    "Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen",
    "Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen",
    "Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen",
    "Sachsen-Anhalt","Schleswig-Holstein","Thüringen"
  ],
  AT: [
    "Burgenland","Kärnten","Niederösterreich","Oberösterreich",
    "Salzburg","Steiermark","Tirol","Vorarlberg","Wien"
  ],
  IT: [
    "Abruzzen","Aostatal","Apulien","Basilikata","Emilia-Romagna",
    "Friaul-Julisch Venetien","Kalabrien","Kampanien","Korsika",
    "Latium","Ligurien","Lombardei","Marken","Molise",
    "Piemont","Sardinien","Sizilien","Toskana","Trentino-Südtirol",
    "Umbrien","Venetien"
  ],
  US: [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado",
    "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho",
    "Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana",
    "Maine","Maryland","Massachusetts","Michigan","Minnesota",
    "Mississippi","Missouri","Montana","Nebraska","Nevada",
    "New Hampshire","New Jersey","New Mexico","New York",
    "North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
    "Pennsylvania","Rhode Island","South Carolina","South Dakota",
    "Tennessee","Texas","Utah","Vermont","Virginia","Washington",
    "West Virginia","Wisconsin","Wyoming"
  ],
  UK: [
    "England","Schottland","Wales","Nordirland"
  ]
};

/**
 * RegionSelect-Komponente analog zu CountrySelect
 * Props erwartet:
 *  - q: Block-Definition (mit q.id, q.text)
 *  - answer: aktueller Wert
 *  - onAnswer: Callback (neuer Wert)
 *  - translations: Übersetzungsobjekt
 *  - lang: aktuelle Sprache
 *  - answers: alle bisherigen Antworten (für country)
 */
function RegionSelect({ q, answer, onAnswer, translations, lang, answers }) {
  // Landsschlüssel muss mit deinem CountrySelect übereinstimmen
  const country = answers['country'] || "";
  const options = regionData[country] || [];

  // React.createElement shorthand
  const e = React.createElement;

  return e('div', { className: 'mb-4' },
    e('label',
      { className: 'block font-medium mb-1', htmlFor: q.id },
      translations[q.id] || q.text
    ),
    e('select',
      {
        id: q.id,
        value: answer || "",
        onChange: ev => onAnswer(ev.target.value),
        className: 'w-full border rounded p-2'
      },
      // erste leere Option
      e('option', { key: '', value: '' }, '— bitte wählen —'),
      // alle Regions-Optionen
      options.map(region =>
        e('option', { key: region, value: region }, region)
      )
    )
  );
}

export { RegionSelect };
