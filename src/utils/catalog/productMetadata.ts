export type SizeChart = { columns: string[]; rows: Array<Record<string, string>> };

export function parseProductSpecifications(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const entries = lines.map((line, index) => {
    const separator = line.indexOf(':');
    if (separator <= 0 || !line.slice(separator + 1).trim()) {
      throw new Error(`Specification line ${index + 1} must use “Name: value”.`);
    }
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()] as const;
  });
  const normalizedNames = entries.map(([name]) => name.toLocaleLowerCase());
  if (new Set(normalizedNames).size !== normalizedNames.length) throw new Error('Specification names must be unique.');
  return Object.fromEntries(entries);
}

export function parseSizeChart(text: string): SizeChart | Record<string, never> {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return {};
  const columns = lines[0].split('|').map((cell) => cell.trim()).filter(Boolean);
  if (columns.length < 2) throw new Error('Size chart needs at least two column names separated by |.');
  if (new Set(columns.map((column) => column.toLocaleLowerCase())).size !== columns.length) throw new Error('Size chart column names must be unique.');
  const rows = lines.slice(1).map((line, index) => {
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.length !== columns.length || cells.some((cell) => !cell)) {
      throw new Error(`Size chart row ${index + 2} must provide ${columns.length} values separated by |.`);
    }
    return Object.fromEntries(columns.map((column, cellIndex) => [column, cells[cellIndex]]));
  });
  return { columns, rows };
}

export function formatProductSpecifications(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return Object.entries(value).map(([name, description]) => `${name}: ${String(description)}`).join('\n');
}

export function formatSizeChart(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const chart = value as Partial<SizeChart>;
  if (!Array.isArray(chart.columns) || !Array.isArray(chart.rows)) return '';
  return [chart.columns.join(' | '), ...chart.rows.map((row) => chart.columns!.map((column) => row[column] || '').join(' | '))].join('\n');
}
