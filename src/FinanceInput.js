// src/FinanceInput.js

function FinanceInput({ answers, setAnswers }) {
  const e = React.createElement;
  const years = [2023, 2024, 2025];

  React.useEffect(() => {
    if (!Array.isArray(answers['Finance Years'])) {
      setAnswers({ ...answers, 'Finance Years': [...years] });
    }
  }, []);

  const selectedYears = answers['Finance Years'] || [];
  const [openRow, setOpenRow] = React.useState('Umsatz');

  function parseNum(val) {
    if (typeof val !== 'string') return null;
    const cleaned = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '');
    const f = parseFloat(cleaned);
    return isNaN(f) ? null : f;
  }
  function formatNum(val) {
    const n = parseNum(val);
    return n === null ? '' : n.toLocaleString('de-CH');
  }

  const revC = selectedYears.every(y => parseNum(answers[`Umsatz ${y}`]) !== null);
  const ceoQ = answers['Einzelgeschäftsführung'] !== undefined;
  const ceoC = revC && ceoQ && selectedYears.every(y => parseNum(answers[`CEO-Saläre ${y}`]) !== null);
  const absC = ceoC && selectedYears.every(y => parseNum(answers[`Abschreibungen ${y}`]) !== null);
  const ebitC = absC && selectedYears.every(y => parseNum(answers[`EBIT ${y}`]) !== null);
  const adjC = ebitC && selectedYears.every(y => parseNum(answers[`EBIT Anpassung ${y}`]) !== null);

  function toggleRow(key) {
    setOpenRow(key);
  }
  function setField(key, y, raw) {
    if (key === 'EBIT') {
      const rev = parseNum(answers[`Umsatz ${y}`]);
      const val = parseNum(raw);
      if (rev !== null && val !== null && val > rev) {
        raw = rev.toString();
      }
    }
    setAnswers({ ...answers, [`${key} ${y}`]: raw });
  }

  function calcEBITMargin(y) {
    const rev = parseNum(answers[`Umsatz ${y}`]);
    const ebit = parseNum(answers[`EBIT ${y}`]);
    return rev && ebit !== null ? Math.round((ebit / rev) * 100) + '%' : '';
  }
  function calcAdjEBIT(y) {
    const ebit = parseNum(answers[`EBIT ${y}`]) || 0;
    const adj = parseNum(answers[`EBIT Anpassung ${y}`]) || 0;
    return ebit + adj;
  }
  function calcEBITC(y) {
    const ceo = parseNum(answers[`CEO-Saläre ${y}`]) || 0;
    return formatNum((calcAdjEBIT(y) + ceo).toString());
  }
  function calcOperativeKosten(y) {
    const rev = parseNum(answers[`Umsatz ${y}`]) || 0;
    const ebit = parseNum(answers[`EBIT ${y}`]) || 0;
    const ceo = parseNum(answers[`CEO-Saläre ${y}`]) || 0;
    const abs = parseNum(answers[`Abschreibungen ${y}`]) || 0;
    const cost = rev - ebit - ceo - abs;
    return cost >= 0 ? formatNum(cost.toString()) : '';
  }

  const rows = [
    { label: 'Umsatz', key: 'Umsatz', input: true, show: () => true },
    { label: 'CEO-Saläre', key: 'CEO-Saläre', input: true, show: () => revC },
    { label: 'Abschreibungen', key: 'Abschreibungen', input: true, show: () => ceoC },
    { label: 'Operative Kosten (geschätzt)', key: 'Operative Kosten', input: false, show: () => absC },
    { label: '──────────── EBIT = Umsatz - Kosten', key: 'ebit-separator', input: false, show: () => absC, separator: true },
    { label: 'EBIT', key: 'EBIT', input: true, show: () => absC },
    { label: 'EBIT-Marge', key: 'EBIT-Marge', input: false, show: () => true, italic: true },
    { label: 'EBIT Anpassung', key: 'EBIT Anpassung', input: true, show: () => ebitC },
    { label: 'EBIT angepasst', key: 'EBIT angepasst', input: false, show: () => ebitC },
    { label: 'EBITC (EBIT+CEO)', key: 'EBITC (EBIT+CEO)', input: false, show: () => ebitC }
  ].filter(r => r.show());

  React.useEffect(() => {
    const lastCompleted = rows.find(r => r.input && selectedYears.every(y => parseNum(answers[`${r.key} ${y}`]) !== null));
    const nextIdx = rows.findIndex(r => r === lastCompleted) + 1;
    if (nextIdx < rows.length && rows[nextIdx].input) {
      setOpenRow(rows[nextIdx].key);
    }
  }, [answers]);

  function renderRow(r) {
    if (r.separator) {
      return React.createElement('tr', { key: r.key },
        React.createElement('td', { colSpan: years.length + 1, className: 'text-center italic text-gray-400 py-1' }, r.label)
      );
    }

    const isOpen = openRow === r.key;
    const labelCell = React.createElement('td', { className: isOpen ? 'bg-gray-50 px-2 py-1 w-56' : 'px-2 py-1 w-56' },
      r.input && React.createElement('button', {
        type: 'button',
        onClick: () => toggleRow(r.key),
        className: 'mr-1'
      }, isOpen ? '▲' : '▼'),
      React.createElement('span', { className: r.italic ? 'italic text-sm text-gray-500' : 'font-medium' }, r.label)
    );

    const valueCells = years.map(y => {
      const key = `${r.key} ${y}`;
      const val = r.key === 'EBIT-Marge'
        ? calcEBITMargin(y)
        : r.key === 'EBIT angepasst'
          ? calcAdjEBIT(y)
          : r.key === 'EBITC (EBIT+CEO)'
            ? calcEBITC(y)
            : r.key === 'Operative Kosten'
              ? calcOperativeKosten(y)
              : answers[key];

      return React.createElement('td', { key: y, className: 'px-1 py-1 text-right' },
        selectedYears.includes(y)
          ? r.input
            ? React.createElement('input', {
                type: 'text',
                value: formatNum(val),
                onChange: ev => setField(r.key, y, ev.target.value),
                className: 'w-full border rounded px-1 text-right',
                inputMode: 'numeric',
                onKeyDown: ev => { if (ev.key === 'Enter') ev.preventDefault(); }
              })
            : React.createElement('span', {}, val)
          : null
      );
    });

    return React.createElement('tr', { key: r.key }, labelCell, ...valueCells);
  }

  return React.createElement('div', { className: 'overflow-x-auto' },
    React.createElement('table', { className: 'table-auto w-full text-sm border-collapse' },
      React.createElement('thead', {},
        React.createElement('tr', {},
          React.createElement('th', { className: 'px-2 py-1 text-right w-56' }, 'Posten'),
          ...years.map(y => React.createElement('th', { key: y, className: 'px-1 py-1 text-right' }, y))
        )
      ),
      React.createElement('tbody', {}, rows.map(r => renderRow(r)))
    )
  );
}

window.FinanceInput = FinanceInput;
