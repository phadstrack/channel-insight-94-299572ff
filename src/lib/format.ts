export const fmtBRL = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export const fmtBRLFull = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const fmtNum = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR");

export const fmtPct = (v: number | null | undefined) =>
  `${(v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export const fmtDateBR = (d: string | Date | null | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
};

export const CHANNEL_COLORS: Record<string, string> = {
  "Meta/Instagram": "#6366f1",
  Google: "#8b5cf6",
  Organico: "#a78bfa",
  "Lead Trafego": "#c4b5fd",
  "X (Twitter)": "#ddd6fe",
  "Sem UTM": "#374151",
  "Sem Lead": "#4b5563",
};

export const channelColor = (c: string) => CHANNEL_COLORS[c] ?? "#6b7280";

export const TIPO_BADGE: Record<string, string> = {
  Existente: "bg-emerald-950 text-emerald-400 border border-emerald-900",
  Inferida: "bg-amber-950 text-amber-400 border border-amber-900",
  "Sem Atribuicao": "bg-red-950 text-red-400 border border-red-900",
};
