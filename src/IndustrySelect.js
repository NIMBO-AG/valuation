// src/IndustrySelect.js

function IndustrySelect({ q, answer, onAnswer, translations, lang, industries }) {
  const e = React.createElement;
  const [expanded, setExpanded] = React.useState({});

  function toggle(code) {
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));
  }

  function renderNodes(nodes, level = 0) {
    return nodes.map(node => {
      const isLeaf = !node.children || node.children.length === 0;
      const isExpanded = !!expanded[node.label];
      const indent = { marginLeft: level * 16 };
      const displayLabel = node.label; // ggf. mit translations[q.key+'.'+node.code] erweitern

      return e('div', { key: node.label, style: indent },
        isLeaf
          ? e('div',
              {
                className: `cursor-pointer mb-1 ${answer === node.code ? 'bg-blue-200' : ''}`,
                onClick: () => onAnswer(node.code)
              },
              displayLabel
            )
          : e('div',
              {
                className: 'flex items-center cursor-pointer mb-1',
                onClick: () => toggle(node.label)
              },
              e('span',
                {
                  style: {
                    display: 'inline-block',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    width: 12, height: 12, marginRight: 6
                  }
                },
                '▸'
              ),
              displayLabel
            ),
        !isLeaf && isExpanded
          ? renderNodes(node.children, level + 1)
          : null
      );
    });
  }

  return e('div', { className: 'mb-4' },
    e('label', { className: 'block font-medium mb-1' },
      translations[q.key] || q.text
    ),
    e('div', {}, renderNodes(industries))
  );
}

window.IndustrySelect = IndustrySelect;
