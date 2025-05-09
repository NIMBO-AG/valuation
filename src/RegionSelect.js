// src/RegionSelect.js

// Hard-coded Regionendaten
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
  GB: [ "Scotland", "Northern Ireland", "Wales", "North East","North West", "Yorkshire and the Humber", "West Midlands", "East Midlands","South West", "South East",  "East of England", "Greater London"
  ]
};

function RegionSelect({ q, answer, onAnswer, translations, lang, answers }) {
  const e = React.createElement;
  // hier nutzen wir den Key aus deinem Sheet:
  const countryVal = answers['Hauptsitz der Firma'] || '';
  const options    = regionData[countryVal] || [];

  // nur rendern, wenn wirklich Daten existieren
  if (!options.length) {
    return null;
  }

  const placeholder = translations['region.placeholder']
    || (lang === 'de' ? 'Bitte wählen' : 'Please select');

  return e('div', { className: 'mb-4' },
    e('label', { className: 'block font-medium mb-1', htmlFor: q.key },
      translations[q.key] || q.text
    ),
    e('select', {
      id: q.key,
      value: answer || '',
      onChange: ev => onAnswer(ev.target.value),
      className: 'w-full border rounded p-2'
    },
      e('option', { value: '', disabled: true }, placeholder),
      options.map(region =>
        e('option', { key: region, value: region }, region)
      )
    )
  );
}

// global registrieren
window.RegionSelect = RegionSelect;
