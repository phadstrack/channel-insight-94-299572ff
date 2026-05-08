import * as XLSX from "xlsx";

export type ParsedSheet = { name: string; headers: string[]; rows: Record<string, unknown>[] };

export function inferType(values: unknown[]): string {
  let n = 0, d = 0, b = 0, total = 0;
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    total++;
    if (typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v))) n++;
    else if (typeof v === "boolean" || /^(true|false)$/i.test(String(v))) b++;
    else if (!isNaN(Date.parse(String(v))) && /\d{4}|\d{2}\/\d{2}/.test(String(v))) d++;
  }
  if (!total) return "text";
  if (n / total > 0.8) return "number";
  if (d / total > 0.8) return "date";
  if (b / total > 0.8) return "boolean";
  return "text";
}

export async function parseFile(file: File): Promise<ParsedSheet[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return wb.SheetNames.map(name => {
    const ws = wb.Sheets[name];
    const arr = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: false });
    const headers = arr.length ? Object.keys(arr[0]) : [];
    return { name, headers, rows: arr };
  });
}
