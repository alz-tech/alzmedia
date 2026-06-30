import './DataList.css';

/**
 * DataList — responsive list/table component.
 *
 * Desktop (>= 760px): renders as a clean table.
 * Mobile  (< 760px): renders each row as a stacked card —
 *   the first column becomes the card title, every other
 *   column becomes a label/value row underneath. Any column
 *   explicitly marked `actions: true` renders full-width at
 *   the bottom of the card instead of being squeezed into a row.
 *
 * This is a drop-in replacement for the old <Table> component —
 * same `columns` / `data` / `loading` / `emptyMessage` props.
 */
export default function DataList({ columns, data, loading, emptyMessage = 'No records found' }) {
  if (loading) {
    return (
      <div className="dl-loading">
        <span className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!data?.length) {
    return <div className="dl-empty">{emptyMessage}</div>;
  }

  const titleCol  = columns[0];
  const bodyCols  = columns.slice(1).filter(c => !c.actions);
  const actionCol = columns.find(c => c.actions);

  return (
    <div className="dl-root">
      {/* ── DESKTOP TABLE (hidden on mobile via CSS) ── */}
      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD LIST (hidden on desktop via CSS) ── */}
      <div className="dl-cards">
        {data.map((row, i) => (
          <div className="dl-card" key={row.id || i}>
            <div className="dl-card-title">
              {titleCol.render ? titleCol.render(row[titleCol.key], row) : row[titleCol.key]}
            </div>

            {bodyCols.length > 0 && (
              <div className="dl-card-body">
                {bodyCols.map(col => {
                  const val = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—');
                  if (val === null || val === undefined) return null;
                  return (
                    <div className="dl-card-row" key={col.key}>
                      <span className="dl-card-label">{col.label}</span>
                      <span className="dl-card-value">{val}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {actionCol && (() => {
              const rendered = actionCol.render(row[actionCol.key], row);
              if (!rendered) return null;
              return <div className="dl-card-actions">{rendered}</div>;
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
