export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsv(csvText: string): ParsedCsv {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const headers = parseLine(lines[0]).map((header) => header.replace(/^"|"$/g, ""));
  if (headers.length === 0 || headers.some((header) => !header)) {
    throw new Error("CSV contains invalid headers");
  }

  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = (cells[idx] ?? "").replace(/^"|"$/g, "").trim();
    });

    return row;
  });

  return { headers, rows };
}
