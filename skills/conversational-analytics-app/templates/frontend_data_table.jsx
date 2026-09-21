// Renders one Conversational Analytics `DataMessage.result` as an HTML
// table with a "Download CSV" button. See ../reference/frontend-ux.md
// ("Data table & CSV export") and ../reference/api-quirks-and-events.md
// (the "Data" message type) for the verified shape of `result`.
//
// Pass the `result` object as-is from a stream message where
// `payload.systemMessage.data.result` is present (skip messages that only
// have `data.query`, with no `result` yet).
export default function DataTable({ result }) {
  if (!result?.formattedData?.length) return null;

  const columns = result.schema?.fields?.length
    ? result.schema.fields
    : Object.keys(result.formattedData[0]).map((name) => ({ name, displayName: name }));

  function downloadCsv() {
    const header = columns.map((c) => escapeCsvValue(c.displayName || c.name));
    const rows = result.formattedData.map((row) => columns.map((c) => escapeCsvValue(row[c.name])));
    const csv = [header, ...rows].map((r) => r.join(",")).join("\r\n");

    // Leading BOM so Excel opens UTF-8 (accented characters, etc) correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.name || "data"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.name}>{c.displayName || c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.formattedData.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.name}>{String(row[c.name] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={downloadCsv}>Download CSV</button>
    </div>
  );
}

function escapeCsvValue(value) {
  const str = value == null ? "" : String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
