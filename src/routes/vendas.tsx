import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtBRL, fmtBRLFull, fmtNum, fmtPct, channelColor, TIPO_BADGE } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas · Febracis MKT" },
      { name: "description", content: "Base completa de vendas com atribuição de lead por venda." },
    ],
  }),
  component: Vendas,
});

type SaleUnified = {
  _idx: number;
  source: "atribuida" | "sem_atribuicao";
  nome: string;
  email: string;
  turma: string;
  data_matricula: string | null;
  valor_convertido: number;
  estado: string | null;
  canal: string;
  tipo_atribuicao: string;
  utm_campanha: string | null;
  grupo_sem_atribuicao: string | null;
  categoria_origem: string | null;
};

type JornadaRow = {
  email: string;
  turma: string;
  toque_num: number;
  tipo: string;
  data_lead: string | null;
  dias_antes_compra: number | null;
  canal_normalizado: string;
  utm_campanha: string | null;
  utm_conteudo: string | null;
  utm_origem: string | null;
};

type TipoFiltro = "Todas" | "Com Lead" | "Sem Lead" | "Sem Atribuicao";
const TIPO_OPTIONS: TipoFiltro[] = ["Todas", "Com Lead", "Sem Lead", "Sem Atribuicao"];
const TIPO_LABELS: Record<TipoFiltro, string> = {
  Todas: "Todas",
  "Com Lead": "Com Lead",
  "Sem Lead": "Sem Lead",
  "Sem Atribuicao": "Sem Atribuição",
};
const PAGE_SIZE = 50;

function Vendas() {
  const { filters } = useFilters();
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("Todas");
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [pagina, setPagina] = useState(1);

  // 1. Vendas atribuídas
  const { data: atribData, isLoading: loadingAtrib } = useQuery({
    queryKey: ["vendas-atrib", filters],
    queryFn: async () => {
      const q = supabase
        .from("vendas_atribuidas")
        .select("nome, email, turma, data_matricula, valor_convertido, estado, canal, tipo_atribuicao, utm_campanha")
        .limit(10000);
      const { data, error } = await applyVendasFilters(q as any, filters);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // 2. Sem atribuição (filtros parciais: data, turma, estado — sem canal)
  const { data: semAtribData, isLoading: loadingSem } = useQuery({
    queryKey: ["vendas-sem-atrib", filters.dateFrom, filters.dateTo, filters.turmas, filters.estados],
    queryFn: async () => {
      let q = supabase
        .from("sem_atribuicao")
        .select("nome, email, turma, data_matricula, valor_convertido, estado, categoria_origem, grupo_sem_atribuicao")
        .limit(5000) as any;
      if (filters.dateFrom) q = q.gte("data_matricula", filters.dateFrom);
      if (filters.dateTo) q = q.lte("data_matricula", filters.dateTo);
      if (filters.turmas.length) q = q.in("turma", filters.turmas);
      if (filters.estados.length) q = q.in("estado", filters.estados);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // 3. Jornada normalizada (para drill-down)
  const { data: jornadaData } = useQuery({
    queryKey: ["vendas-jornada"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jornada_normalizada")
        .select("email, turma, toque_num, tipo, data_lead, dias_antes_compra, canal_normalizado, utm_campanha, utm_conteudo, utm_origem")
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as JornadaRow[];
    },
  });

  const isLoading = loadingAtrib || loadingSem;

  // Merge unificado
  const allSales = useMemo<SaleUnified[]>(() => {
    const atrib: SaleUnified[] = (atribData ?? []).map((r: any, i: number) => ({
      _idx: i,
      source: "atribuida",
      nome: r.nome ?? "—",
      email: r.email ?? "",
      turma: r.turma ?? "—",
      data_matricula: r.data_matricula,
      valor_convertido: Number(r.valor_convertido ?? 0),
      estado: r.estado,
      canal: r.canal ?? "Sem Lead",
      tipo_atribuicao: r.tipo_atribuicao ?? "Sem Atribuicao",
      utm_campanha: r.utm_campanha,
      grupo_sem_atribuicao: null,
      categoria_origem: null,
    }));
    const sem: SaleUnified[] = (semAtribData ?? []).map((r: any, i: number) => ({
      _idx: atrib.length + i,
      source: "sem_atribuicao",
      nome: r.nome ?? "—",
      email: r.email ?? "",
      turma: r.turma ?? "—",
      data_matricula: r.data_matricula,
      valor_convertido: Number(r.valor_convertido ?? 0),
      estado: r.estado,
      canal: "Sem Lead",
      tipo_atribuicao: "Sem Atribuicao",
      utm_campanha: null,
      grupo_sem_atribuicao: r.grupo_sem_atribuicao,
      categoria_origem: r.categoria_origem,
    }));
    return [...atrib, ...sem].sort((a, b) => {
      if (!a.data_matricula) return 1;
      if (!b.data_matricula) return -1;
      return b.data_matricula.localeCompare(a.data_matricula);
    });
  }, [atribData, semAtribData]);

  // Índice de jornada por email|turma
  const jornadaMap = useMemo(() => {
    const m: Record<string, JornadaRow[]> = {};
    for (const j of jornadaData ?? []) {
      const k = `${j.email}|${j.turma}`;
      m[k] = m[k] ?? [];
      m[k].push(j);
    }
    for (const k of Object.keys(m)) {
      m[k].sort((a, b) => a.toque_num - b.toque_num);
    }
    return m;
  }, [jornadaData]);

  // KPIs
  const receitaTotal = allSales.reduce((s, r) => s + r.valor_convertido, 0);
  const ticketMedio = allSales.length > 0 ? receitaTotal / allSales.length : 0;
  const comLead = allSales.filter((r) => r.tipo_atribuicao === "Existente" || r.tipo_atribuicao === "Inferida").length;
  const pctAtrib = allSales.length > 0 ? (comLead / allSales.length) * 100 : 0;

  // Filtro local
  const filtered = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return allSales.filter((r) => {
      if (term && !r.nome.toLowerCase().includes(term) && !r.email.toLowerCase().includes(term)) return false;
      if (tipoFiltro === "Com Lead" && r.tipo_atribuicao !== "Existente" && r.tipo_atribuicao !== "Inferida") return false;
      if (tipoFiltro === "Sem Lead" && !(r.source === "atribuida" && r.canal === "Sem Lead")) return false;
      if (tipoFiltro === "Sem Atribuicao" && r.source !== "sem_atribuicao") return false;
      return true;
    });
  }, [allSales, busca, tipoFiltro]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPages);
  const pageRows = filtered.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  function toggleExpand(idx: number) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleBusca(v: string) {
    setBusca(v);
    setPagina(1);
  }

  function handleTipo(t: TipoFiltro) {
    setTipoFiltro(t);
    setPagina(1);
  }

  const exportCsv = () => {
    const headers = ["nome", "email", "turma", "data", "valor", "canal", "tipo_atribuicao", "estado", "utm_campanha", "grupo"];
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        [
          `"${r.nome}"`,
          `"${r.email}"`,
          `"${r.turma}"`,
          `"${r.data_matricula ?? ""}"`,
          r.valor_convertido.toFixed(2),
          `"${r.canal}"`,
          `"${r.tipo_atribuicao}"`,
          `"${r.estado ?? ""}"`,
          `"${r.utm_campanha ?? ""}"`,
          `"${r.grupo_sem_atribuicao ?? ""}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendas-completo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Vendas" subtitle="Base completa — atribuídas e sem atribuição" />
      <GlobalFilters />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total de Vendas" value={fmtNum(allSales.length)} accent="#6366f1" loading={isLoading} />
        <KpiCard label="Receita Total" value={fmtBRLFull(receitaTotal)} accent="#8b5cf6" loading={isLoading} />
        <KpiCard label="Ticket Médio" value={fmtBRLFull(ticketMedio)} accent="#a78bfa" loading={isLoading} />
        <KpiCard
          label="Com canal identificado"
          value={fmtPct(pctAtrib)}
          hint={`${fmtNum(comLead)} de ${fmtNum(allSales.length)}`}
          accent="#4ade80"
          loading={isLoading}
        />
      </div>

      <Card>
        {/* Controles */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Input
            placeholder="Buscar nome ou email..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            className="h-8 w-[220px] text-xs bg-card"
          />
          <div className="flex gap-1">
            {TIPO_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => handleTipo(t)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium border transition",
                  tipoFiltro === t
                    ? "bg-primary/20 border-primary/40 text-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {TIPO_LABELS[t]}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{fmtNum(filtered.length)} registros</span>
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs">
            <Download className="size-3.5 mr-1.5" /> Exportar CSV
          </Button>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-2 pr-2 w-6" />
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Turma</th>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4 text-right">Valor</th>
                <th className="py-2 pr-4">Canal</th>
                <th className="py-2 pr-4">Atribuição</th>
                <th className="py-2 pr-4">UF</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">Carregando…</td></tr>
              )}
              {!isLoading && pageRows.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">Nenhum registro encontrado</td></tr>
              )}
              {pageRows.map((r) => {
                const expanded = expandidos.has(r._idx);
                const leads = jornadaMap[`${r.email}|${r.turma}`] ?? [];
                return (
                  <>
                    <tr
                      key={r._idx}
                      onClick={() => toggleExpand(r._idx)}
                      className="border-b border-border/30 cursor-pointer hover:bg-accent/30 transition"
                    >
                      <td className="py-2.5 pr-2 text-muted-foreground">
                        {expanded
                          ? <ChevronDown className="size-3.5" />
                          : <ChevronRight className="size-3.5" />}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-medium truncate max-w-[180px]" title={r.nome}>{r.nome}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{r.email}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground truncate max-w-[200px]">{r.turma}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {r.data_matricula ? r.data_matricula.slice(0, 10) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-semibold whitespace-nowrap">{fmtBRL(r.valor_convertido)}</td>
                      <td className="py-2.5 pr-4">
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="size-2 rounded-sm" style={{ background: channelColor(r.canal) }} />
                          {r.canal}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${TIPO_BADGE[r.tipo_atribuicao] ?? "bg-muted text-muted-foreground"}`}>
                          {r.tipo_atribuicao === "Sem Atribuicao" ? "Sem Atribuição" : r.tipo_atribuicao}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{r.estado ?? "—"}</td>
                    </tr>

                    {expanded && (
                      <tr key={`${r._idx}-detail`} className="border-b border-border/30 bg-card/60">
                        <td colSpan={8} className="px-8 py-3">
                          {leads.length === 0 ? (
                            <div className="text-xs text-muted-foreground py-1">
                              {r.source === "sem_atribuicao"
                                ? `Nenhum lead encontrado · Grupo: ${r.grupo_sem_atribuicao ?? "—"} · Categoria: ${r.categoria_origem ?? "—"}`
                                : "Nenhum lead registrado para esta venda."}
                            </div>
                          ) : (
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                {leads.length} toque{leads.length > 1 ? "s" : ""} de lead
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/40">
                                    <th className="py-1 pr-3 text-left">#</th>
                                    <th className="py-1 pr-3 text-left">Tipo</th>
                                    <th className="py-1 pr-3 text-left">Data Lead</th>
                                    <th className="py-1 pr-3 text-left">Canal</th>
                                    <th className="py-1 pr-3 text-left">Campanha</th>
                                    <th className="py-1 pr-3 text-left">Origem UTM</th>
                                    <th className="py-1 pr-3 text-right">Dias antes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {leads.map((l) => (
                                    <tr key={l.toque_num} className="border-b border-border/20 last:border-0">
                                      <td className="py-1.5 pr-3 text-muted-foreground">{l.toque_num}</td>
                                      <td className="py-1.5 pr-3">
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded text-[10px]",
                                          l.tipo === "Único" || l.tipo === "Unico" ? "bg-emerald-950 text-emerald-400" :
                                          l.tipo === "Último Toque" || l.tipo === "Ultimo Toque" ? "bg-indigo-950 text-indigo-400" :
                                          l.tipo === "Primeiro Toque" ? "bg-violet-950 text-violet-400" :
                                          "bg-muted text-muted-foreground"
                                        )}>
                                          {l.tipo}
                                        </span>
                                      </td>
                                      <td className="py-1.5 pr-3 text-muted-foreground whitespace-nowrap">
                                        {l.data_lead ? l.data_lead.slice(0, 10) : "—"}
                                      </td>
                                      <td className="py-1.5 pr-3">
                                        <span className="flex items-center gap-1">
                                          <span className="size-1.5 rounded-sm" style={{ background: channelColor(l.canal_normalizado) }} />
                                          {l.canal_normalizado || "—"}
                                        </span>
                                      </td>
                                      <td className="py-1.5 pr-3 text-muted-foreground truncate max-w-[200px]" title={l.utm_campanha ?? ""}>
                                        {l.utm_campanha || "—"}
                                      </td>
                                      <td className="py-1.5 pr-3 text-muted-foreground">{l.utm_origem || "—"}</td>
                                      <td className="py-1.5 pr-3 text-right text-muted-foreground">
                                        {l.dias_antes_compra != null ? `${l.dias_antes_compra}d` : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Página {paginaAtual} de {totalPages} · {fmtNum(filtered.length)} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={paginaAtual <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={paginaAtual >= totalPages}
                onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
