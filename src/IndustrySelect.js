// src/IndustrySelect.js

/**
 * Renders a tree of industries up to 3 levels deep.
 * If `answer` is already set (e.g. prefill), all branches leading
 * to the selected node will be expanded automatically.
 */
function IndustrySelect({ q, answer, onAnswer, translations, lang, industries }) {
  const e = React.createElement;
  const [expanded, setExpanded] = React.useState({});

  // Helper: find the path of labels leading to the node with code === targetCode
  function findAncestorLabels(nodes, targetCode, ancestors = []) {
    for (const node of nodes) {
      // leaf node?
      if (node.code === targetCode) {
        return ancestors;
      }
      // group node?
      if (node.children) {
        const result = findAncestorLabels(
          node.children,
          targetCode,
          ancestors.concat(node.label)
        );
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  // On mount or when `answer` / `industries` change, auto-expand path
  React.useEffect(() => {
    if (!answer || !industries || industries.length === 0) return;
    const path = findAncestorLabels(industries, answer);
    if (path) {
      // mark each ancestor label as expanded
      const init = {};
      path.forEach(label => { init[label] = true });
      setExpanded(init);
    }
  }, [answer, industries]);

  // toggle a branch open/closed
  function toggle(label) {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  }

  // recursively render nodes
  function renderNodes(nodes, level = 0) {
    return nodes.map(node => {
      const isLeaf     = !node.children || node.children.length === 0;
      const isExpanded = !!expanded[node.label];
      const indent     = { marginLeft: level * 16 };

      // display text (could be extended with translations[node.label])
      const display = translations[node.label] || node.label;

      // branch (has children)
      if (!isLeaf) {
        return e('div', { key: node.label, style: indent },
          // clickable header
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
          // children if expanded
          isExpanded ? renderNodes(node.children, level + 1) : null
        );
      }

      // leaf
      return e('div', {
        key: node.code,
        style: indent,
        className: `cursor-pointer mb-1 ${answer === node.code ? 'bg-blue-200' : ''}`,
        onClick: () => onAnswer(node.code)
      }, display);
    });
  }

  return e('div', { className: 'mb-4' },
    e('label', { className: 'block font-medium mb-1' },
      translations[q.key] || q.text
    ),
    e('div', {}, renderNodes(industries))
  );
}

// Register globally so questionRenderer can do e(window.IndustrySelect,…)
window.IndustrySelect = IndustrySelect;
