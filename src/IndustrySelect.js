// src/IndustrySelect.js

/**
 * Mehrstufige Branchen-Auswahl.
 * Nutzt den deutschen Branchen-String als Übersetzungs-Key.
 */
function IndustrySelect({ q, answer, onAnswer, translations, lang, industries }) {
  const e = React.createElement;
  const [expanded, setExpanded] = React.useState({});

  // Findet alle übergeordneten Labels, damit wir sie beim Prefill öffnen können
  function findAncestorLabels(nodes, targetCode, ancestors = []) {
    for (const node of nodes) {
      if (node.code === targetCode) {
        return ancestors;
      }
      if (node.children) {
        const res = findAncestorLabels(
          node.children,
          targetCode,
          ancestors.concat(node.label)
        );
        if (res) return res;
      }
    }
    return null;
  }

  // Beim Mount / wenn answer wechselt: öffne automatisch die Pfade zum gesetzten Leaf
  React.useEffect(() => {
    if (!answer || industries.length === 0) return;
    const path = findAncestorLabels(industries, answer);
    if (path) {
      const init = {};
      path.forEach(label => { init[label] = true });
      setExpanded(init);
    }
  }, [answer, industries]);

  function toggle(label) {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function renderNodes(nodes, level = 0) {
    return nodes.map(node => {
      const isLeaf     = !node.children || node.children.length === 0;
      const isExpanded = !!expanded[node.label];
      const indent     = { marginLeft: level * 16 };

      // WIR LESEN HIER DIRECT ÜBER DEN GERMAN KEY AUS DEM TRANSLATIONS-SHEET
      const display = translations[node.label] || node.label;

      if (!isLeaf) {
        return e('div', { key: node.label, style: indent },
          e('div', {
            className: 'flex items-center cursor-pointer mb-1',
            onClick: () => toggle(node.label)
          },
            e('span', {
              style: {
                display: 'inline-block',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform .1s',
                width: 12, height: 12, marginRight: 6
              }
            }, '▸'),
            display
          ),
          isExpanded ? renderNodes(node.children, level + 1) : null
        );
      }

      return e('div', {
        key: node.code,
        style: indent,
        className: `cursor-pointer mb-1 ${answer === node.code ? 'bg-blue-200' : ''}`,
        onClick: () => onAnswer(node.code)
      }, display);
    });
  }

  return e('div', { className: 'mb-4' },
    e('label', { className: 'block font-medium mb-1' }, translations[q.key] || q.text),
    e('div', {}, renderNodes(industries))
  );
}

// Globale Registrierung
window.IndustrySelect = IndustrySelect;
