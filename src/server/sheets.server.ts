// Server-only helpers para importar Google Sheets via CSV publicado.
import Papa from "papaparse";

export function extractSpreadsheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function extractGid(url: string): string {
  const m = url.match(/[?#&]gid=(\d+)/);
  return m ? m[1] : "0";
}

export function buildCsvUrl(sheetUrl: string, gidOverride?: string): string {
  const id = extractSpreadsheetId(sheetUrl);
  if (!id) throw new Error("URL inválida do Google Sheets");
  const gid = gidOverride ?? extractGid(sheetUrl);
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export async function fetchCsvRows(csvUrl: string): Promise<Record<string, string>[]> {
  const res = await fetch(csvUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Falha ao buscar planilha (${res.status}). A planilha está como "Qualquer pessoa com o link pode visualizar"?`,
    );
  }
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return parsed.data as Record<string, string>[];
}

// Mapeamento flexível de nome de coluna → chave canônica
const COLUMN_ALIASES: Record<string, string[]> = {
  email: ["email", "e-mail", "e_mail", "mail"],
  telefone: ["telefone", "phone", "celular", "whatsapp"],
  nome: ["nome", "name", "nome_completo", "full_name"],
  data_lead: ["data_lead", "data lead", "data do lead", "lead_date", "criado_em", "data_criacao"],
  data_matricula: ["data_matricula", "data matrícula", "data da matricula", "data_da_matricula", "data_venda", "data da venda"],
  valor_convertido: ["valor_convertido", "valor", "valor_venda", "valor convertido", "receita"],
  turma: ["turma", "edicao", "edição", "classe"],
  cidade: ["cidade", "city"],
  estado: ["estado", "uf", "state"],
  utm_source: ["utm_source", "utm source", "source", "origem_utm"],
  utm_medium: ["utm_medium", "utm medium", "medium", "midia_utm"],
  utm_campaign: ["utm_campaign", "utm campaign", "campaign", "campanha"],
  utm_content: ["utm_content", "utm content", "content", "conteudo"],
  utm_term: ["utm_term", "utm term", "term", "termo"],
  origem_lead: ["origem_lead", "origem do lead", "origem", "ultima_origem_lead", "última origem do lead"],
};

function normHeader(s: string) {
  return s.trim().toLowerCase().replace(/[\s_-]+/g, "_");
}

export function buildHeaderMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const normToOrig = new Map(headers.map((h) => [normHeader(h), h]));
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const key = normHeader(alias);
      if (normToOrig.has(key)) {
        map[canonical] = normToOrig.get(key)!;
        break;
      }
    }
  }
  return map;
}

export function pick(row: Record<string, string>, headerMap: Record<string, string>, key: string): string | null {
  const orig = headerMap[key];
  if (!orig) return null;
  const v = row[orig];
  if (v === undefined || v === null || v === "") return null;
  return String(v).trim();
}

export function parseDate(s: string | null): string | null {
  if (!s) return null;
  // tenta ISO primeiro
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    let y = m[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo}-${d}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function parseNumber(s: string | null): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}
