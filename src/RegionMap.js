// src/RegionMap.js
(function(){
  // TopoJSON mit Admin-1-Grenzen (Provinzen, States etc.)
  const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/admin1-10m.json';

  function RegionMap(props) {
    const countryCode = props.countryCode;
    const onSelect    = props.onSelect;
    if (!countryCode) return null;

    // Greife auf die UMD-Exporte zu
    const {
      ComposableMap,
      Geographies,
      Geography,
      ZoomableGroup
    } = window.ReactSimpleMaps;

    return React.createElement(
      ComposableMap,
      {
        projectionConfig: { scale: 400 },
        style:            { width: '100%', height: 'auto' }
      },
      React.createElement(
        ZoomableGroup,
        { zoom: 2 },
        React.createElement(
          Geographies,
          { geography: GEO_URL },
          function({ geographies }) {
            return geographies
              .filter(
                geo =>
                  geo.properties.iso_3166_1_alpha2 === countryCode
              )
              .map(geo =>
                React.createElement(Geography, {
                  key:       geo.rsmKey,
                  geography: geo,
                  onClick:   () => onSelect(geo.properties.name),
                  style: {
                    default: { fill: '#EEE', outline: 'none' },
                    hover:   { fill: '#DDD', outline: 'none' },
                    pressed: { fill: '#CCC', outline: 'none' },
                  }
                })
              );
          }
        )
      )
    );
  }

  // global verfügbar machen
  window.RegionMap = RegionMap;
})();
