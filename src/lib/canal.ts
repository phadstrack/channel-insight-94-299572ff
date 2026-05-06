// Derivação de canal a partir de utm_source / utm_medium / origem_lead
// Padrão novo (>= 01/05/2026): utm_source no formato mkt_<canal>
// Padrão legado: heurísticas por substring

export type CanalInput = {
  utm_source?: string | null;
  utm_medium?: string | null;
  origem_lead?: string | null;
};

const CANAIS_NORMALIZADOS: Record<string, string> = {
  meta: "Meta/Instagram",
  facebook: "Meta/Instagram",
  instagram: "Meta/Instagram",
  fb: "Meta/Instagram",
  ig: "Meta/Instagram",
  google: "Google",
  gads: "Google",
  adwords: "Google",
  youtube: "YouTube",
  yt: "YouTube",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  wpp: "WhatsApp",
  email: "E-mail",
  organico: "Orgânico",
  organic: "Orgânico",
  seo: "Orgânico",
  direct: "Direto",
  direto: "Direto",
  x: "X (Twitter)",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  bing: "Bing",
};

function norm(s?: string | null) {
  return (s ?? "").toString().trim().toLowerCase();
}

export function deriveCanal(input: CanalInput): string {
  const src = norm(input.utm_source);
  const med = norm(input.utm_medium);
  const orig = norm(input.origem_lead);

  // 1. Padrão novo: mkt_<canal>
  const mkt = src.match(/^mkt[_\-\s]+(.+)$/);
  if (mkt) {
    const key = mkt[1].replace(/[_\-\s]+/g, "");
    if (CANAIS_NORMALIZADOS[key]) return CANAIS_NORMALIZADOS[key];
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  // 2. Match direto na utm_source normalizada
  const srcKey = src.replace(/[_\-\s]+/g, "");
  if (CANAIS_NORMALIZADOS[srcKey]) return CANAIS_NORMALIZADOS[srcKey];

  // 3. Heurística por substring (legado)
  const haystack = `${src} ${med} ${orig}`;
  if (/face|insta|meta|\bfb\b|\big\b/.test(haystack)) return "Meta/Instagram";
  if (/google|gads|adwords|gdn/.test(haystack)) return "Google";
  if (/youtube|\byt\b/.test(haystack)) return "YouTube";
  if (/tiktok/.test(haystack)) return "TikTok";
  if (/whats|wpp/.test(haystack)) return "WhatsApp";
  if (/\bemail\b|mailchimp|rdstation/.test(haystack)) return "E-mail";
  if (/organ|seo/.test(haystack)) return "Orgânico";
  if (/direct|direto/.test(haystack)) return "Direto";
  if (/linkedin/.test(haystack)) return "LinkedIn";
  if (/twitter|\bx\b/.test(haystack)) return "X (Twitter)";
  if (/bing/.test(haystack)) return "Bing";
  if (/indica|referral|referência/.test(haystack)) return "Indicação";

  if (orig) return "Outros (com lead)";
  return "Sem Atribuição";
}
