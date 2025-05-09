
import React from "react";

const REGION_DATA = {
  DE: ["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"],
  US: ["California", "Texas", "Florida", "New York", "Illinois", "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan"],
  GB: ["England", "Scotland", "Wales", "Northern Ireland"],
  IT: ["Lombardia", "Lazio", "Campania", "Sicilia", "Veneto", "Emilia-Romagna", "Toscana", "Puglia", "Piemonte", "Calabria"],
  AT: ["Wien", "Niederösterreich", "Oberösterreich", "Steiermark", "Tirol", "Kärnten", "Salzburg", "Vorarlberg", "Burgenland"]
};

export default function RegionSelector({ block, value, onChange, answers }) {
  const country = answers["Country"];
  const regions = REGION_DATA[country];

  if (!regions) return null;

  return (
    <div className="mb-4">
      <label className="block mb-2 font-semibold">{block.question}</label>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={value || ""}
        onChange={e => onChange(block.name, e.target.value)}
      >
        <option value="">Bitte auswählen</option>
        {regions.map(region => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </div>
  );
}
