// Nova taxonomia de canais (alinhada ao SQL public.derive_canal):
// - Mídia: tráfego pago (Meta, Google, TikTok, ads em geral, LP/VSL/[FB][GO])
// - CRM: e-mail e WhatsApp (mailchimp, rdstation, sz chat)
// - YouTube: tudo relacionado a YouTube
// - Redes: redes sociais, Social Seller / SS, indicações, stand
// - Orgânicos: utm_medium organic / [ORG] / SEO / site
// - Outros: tem origem mas não classifica
// - Sem Atribuição: sem nada

export type CanalInput = {
  utm_source?: string | null;
  utm_medium?: string | null;
  origem_lead?: string | null;
  ultima_origem_lead?: string | null;
};

const norm = (s?: string | null) => (s ?? "").toString().toLowerCase();

export function deriveCanal(input: CanalInput): string {
  const s = norm(input.utm_source);
  const m = norm(input.utm_medium);
  const o = norm(input.origem_lead);
  const u = norm(input.ultima_origem_lead);
  const hay = `${s} ${m} ${o} ${u}`;

  if (/(youtube|\[yt\]|\byt\b|y_tube)/.test(hay)) return "YouTube";
  if (/(email|e-mail|mailchimp|rdstation|rd_email|whats|wpp|whatsapp|sz chat|sz_chat|szchat|\bcrm\b)/.test(hay))
    return "CRM";
  if (/(social seller|social_seller|\bss\b|ss mcis|ss_mcis|stand cis|indica|referral|referência|aluno cis)/.test(hay))
    return "Redes";
  if (/(organic|organico|orgânico|seo)/.test(m) || /(organic|organico|seo|site)/.test(s) || /(\[org\]|\borg\b|orgânico|organico)/.test(hay))
    return "Orgânicos";
  if (
    /(ads|cpc|paid|trafego|tráfego|cpm|display|video)/.test(m) ||
    /(meta|facebook|instagram|\bfb\b|\big\b|google|gads|adwords|tiktok|bing|linkedin|twitter|\bx\b|ads_|mkt_|google_search)/.test(s) ||
    /(\[fb\]|\[go\]|\[cm\]|tráfego|trafego|form - meta|meta lead ads|google_search|ads_gg|ads_fb|ads_meta|\[lp\]|\[vsl\]|\[pgven\]|\[ck\])/.test(hay)
  )
    return "Mídia";

  if (o.length > 0 || u.length > 0 || s.length > 0) return "Outros";
  return "Sem Atribuição";
}
