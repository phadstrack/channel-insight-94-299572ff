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

// Mapeamento canônico → possíveis labels (case/acento-insensitive)
const COLUMN_ALIASES: Record<string, string[]> = {
  // ===== Leads (RD Station) =====
  id_lead_rd: ["id do lead", "id_lead", "lead id", "id"],
  email: ["email", "e-mail", "mail", "cliente pessoal: email", "cliente pessoal email"],
  nome: ["sobrenome", "nome", "nome do cliente", "name", "full_name"],
  telefone: ["celular", "celular(whatsapp)", "celular whatsapp", "telefone", "phone", "whatsapp"],
  proprietario: ["proprietário do lead", "proprietario do lead", "proprietário da venda", "proprietario da venda", "proprietario", "owner"],
  status_lead: ["status do lead", "status"],
  unidade_rd: ["unidade rd", "unidade"],
  origem_lead: ["origem do lead", "origem"],
  ultima_origem_lead: ["última origem do lead", "ultima origem do lead", "última origem", "last origin"],
  url_cadastro: ["url de cadastro", "url cadastro", "lp", "landing page"],
  data_lead_criacao: ["data e hora de criação", "data e hora de criacao", "data de criação", "data de criacao", "criado em", "created_at"],
  objecoes: ["objeções", "objecoes"],
  // UTMs (rd usa nomes em PT, vendas usa em EN)
  utm_origem: ["utm origem", "utm_origem", "utm source", "utm_source", "source"],
  utm_midia: ["utm média", "utm media", "utm_media", "utm_medium", "utm medium", "medium"],
  utm_campanha: ["utm campanha", "utm_campanha", "utm campaign", "utm_campaign", "campaign"],
  utm_conteudo: ["utm conteúdo", "utm conteudo", "utm_conteudo", "utm content", "utm_content", "content"],
  utm_termo: ["utm termo", "utm_termo", "utm term", "utm_term", "term"],
  utm_gclid: ["utm gclid", "utm_gclid", "gclid"],
  // Geo (várias variantes na planilha de leads)
  cidade: ["cidade", "cidade(2)", "cidade de residência", "cidade de residencia", "city"],
  estado: ["estado", "estado(2)", "estado de residência", "estado de residencia", "uf", "state"],
  // ===== Vendas =====
  id_venda: ["id da venda", "id_venda", "id venda"],
  nome_venda: ["nome da venda"],
  lead_origem: ["lead de origem"],
  curso: ["curso(2)", "curso"],
  codigo_curso: ["código do curso", "codigo do curso", "codigo_curso"],
  unidade_geradora: ["unidade geradora da venda", "unidade geradora"],
  codigo_unidade: ["codigodaunidadegeradora", "codigo da unidade geradora"],
  fase: ["fase"],
  valor: ["valor"],
  valor_moeda: ["valor moeda"],
  valor_convertido: ["valor (convertido)", "valor convertido"],
  valor_convertido_moeda: ["valor (convertido) moeda"],
  qtd_pagantes: ["quantidade de pagantes", "qtd pagantes"],
  qtd_parcelas: ["quantidade de parcelas", "qtd parcelas"],
  promocao: ["promoção", "promocao"],
  venda_pai: ["venda pai"],
  pacote: ["pacote do aluno", "pacote"],
  canal_venda: ["canal da venda", "canal"],
  checkout: ["checkout cispay", "checkout"],
  turma: ["turma(3)", "turma", "edição", "edicao", "classe"],
  mes_venda: ["mês da venda", "mes da venda"],
  data_nascimento: ["data de nascimento"],
  sexo: ["sexo"],
  data_venda_criacao: ["data de criação", "data de criacao"],
  data_aprovacao: ["data de aprovação", "data de aprovacao"],
  data_matricula: ["data da matrícula", "data da matricula", "data_matricula"],
};

function normHeader(s: string) {
  return s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();
}

export function buildHeaderMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const normToOrig = new Map<string, string>();
  for (const h of headers) {
    const k = normHeader(h);
    if (!normToOrig.has(k)) normToOrig.set(k, h);
  }
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

// Aceita ISO, dd/mm/yyyy, "Date(2026,3,18,20,32,0)" (Google Sheets — mês 0-indexed)
export function parseDate(s: string | null): string | null {
  if (!s) return null;
  const gs = s.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
  if (gs) {
    const y = +gs[1], mo = +gs[2] + 1, d = +gs[3];
    return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
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

export function parseTimestamp(s: string | null): string | null {
  if (!s) return null;
  const gs = s.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
  if (gs) {
    const y = +gs[1], mo = +gs[2], d = +gs[3];
    const h = gs[4] ? +gs[4] : 0, mi = gs[5] ? +gs[5] : 0, se = gs[6] ? +gs[6] : 0;
    return new Date(Date.UTC(y, mo, d, h, mi, se)).toISOString();
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  const date = parseDate(s);
  return date ? `${date}T00:00:00Z` : null;
}

export function parseNumber(s: string | null): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

export function parseInt0(s: string | null): number | null {
  if (!s) return null;
  const n = parseNumber(s);
  return isNaN(n) ? null : Math.round(n);
}

// Title-case "SÃO PAULO" → "São Paulo"
export function titleCase(s: string | null): string | null {
  if (!s) return null;
  return s.toLowerCase().replace(/(^|\s|-)([a-zà-ú])/g, (_, p1, p2) => p1 + p2.toUpperCase());
}
