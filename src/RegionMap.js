// src/RegionMap.js
import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';

// TopoJSON mit Admin-1 Grenzziehung (Provinzen, States…)
const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/admin1-10m.json';

export default function RegionMap({ countryCode, onSelect }) {
  if (!countryCode) return null;

  return (
    <ComposableMap
      projectionConfig={{ scale: 400 }}
      style={{ width: '100%', height: 'auto' }}
    >
      <ZoomableGroup zoom={2}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              // hier ISO_A2 property je nach TopoJSON anpassen
              .filter(geo => geo.properties.iso_3166_1_alpha2 === countryCode)
              .map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onSelect(geo.properties.name)}
                  style={{
                    default:   { fill: '#EEE', outline: 'none' },
                    hover:     { fill: '#DDD', outline: 'none' },
                    pressed:   { fill: '#CCC', outline: 'none' },
                  }}
                />
              ))
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
}
