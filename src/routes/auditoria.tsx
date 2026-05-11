import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { fmtNum, SEVERITY_BADGE, MATCH_METHOD_LABEL } from "@/lib/format";
import { RefreshCw, AlertTriangle, ShieldCheck, Database } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria · Febracis MKT" },
      { name: "description", content: "Qualidade de dados, matching e reconciliação." },
    ],
  }),
  component: Auditoria,
});

const RULE_LABELS: Record<string, string> = {
  email_invalido: "Email com formato inválido",
  telefone_invalido: "Telefone inválido (<10 dígitos ou repetido)",
  duplicidade_suspeita: "Possível duplicidade (nome+valor+data)",
  data_matricula_suspeita: "Data de matrícula fora do range",
  valor_invalido: "Valor convertido ≤ 0",
  sem_identificador: "Venda sem email nem telefone",
  lead_posterior_a_venda: "Lead criado depois da venda (atribuição fraca)",
};

function Auditoria() {
  const qc = useQueryClient();
  const [openRule, setOpenRule] = useState<string | null>(null);

  const { data: status } = useQuery({
    queryKey: ["pipeline-status"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_pipeline_status");
      if (error) throw error;
      return data as any;
    },
  });

  const { data: dq } = useQuery({
    queryKey: ["dq-summary"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_dq_summary");
      if (error) throw error;
      return (data ?? []) as { rule: string; severity: string; total: number }[];
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["match-breakdown"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_match_breakdown");
      if (error) throw error;
      return (data ?? []) as { match_method: string; total: number; pre_sale: number; posterior: number; avg_lag: number }[];
    },
  });

  const { data: attr } = useQuery({
    queryKey: ["attr-breakdown"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_attribution_breakdown");
      if (error) throw error;
      return (data ?? []) as { tipo_atribuicao: string; total: number; receita: number }[];
    },
  });

  const { data: findings } = useQuery({
    queryKey: ["dq-findings", openRule],
    enabled: !!openRule,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_dq_findings", { p_rule: openRule, p_limit: 200 });
      if (error) throw error;
      return (data ?? []) as { id: number; entity: string; entity_id: string; severity: string; details: any; created_at: string }[];
    },
  });

  const rebuild = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc("rebuild_core");
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      toast.success(`Rebuild concluído: ${d?.vendas ?? 0} vendas, ${d?.bridges ?? 0} matches, ${d?.dq_findings ?? 0} achados.`);
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro no rebuild"),
  });

  const totals = status?.totals ?? {};
  const errors = (dq ?? []).filter((d) => d.severity === "error").reduce((s, d) => s + Number(d.total), 0);
  const warns = (dq ?? []).filter((d) => d.severity === "warn").reduce((s, d) => s + Number(d.total), 0);
  const infos = (dq ?? []).filter((d) => d.severity === "info").reduce((s, d) => s + Number(d.total), 0);

  return (
    <>
      <PageHeader
        title="Auditoria"
        subtitle={
          status?.as_of
            ? `Snapshot em ${new Date(status.as_of).toLocaleString("pt-BR")}`
            : "Sem rebuild registrado"
        }
        tutorialKey="auditoria"
        actions={
          <Button size="sm" onClick={() => rebuild.mutate()} disabled={rebuild.isPending}>
            <RefreshCw className={`size-3.5 mr-1.5 ${rebuild.isPending ? "animate-spin" : ""}`} />
            {rebuild.isPending ? "Rebuildando…" : "Rebuild Core"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pessoas únicas" value={fmtNum(totals.pessoas)} accent="#6366f1" hint={<span className="flex items-center gap-1"><Database className="size-3" />deduplicação por email/tel/nome</span>} />
        <KpiCard label="Vendas (fato)" value={fmtNum(totals.vendas)} accent="#8b5cf6" hint={`${fmtNum(totals.rd_vendas_origem)} na origem`} />
        <KpiCard label="Leads (fato)" value={fmtNum(totals.leads)} accent="#a78bfa" hint={`RD ${fmtNum(totals.rd_leads_origem)} · planilha ${fmtNum(totals.planilha_leads_origem)}`} />
        <KpiCard label="Matches primários" value={fmtNum(totals.bridges)} accent="#4ade80" hint={`${totals.vendas ? Math.round((totals.bridges / totals.vendas) * 100) : 0}% das vendas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title="Atribuição por tipo">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Tipo</th>
                <th className="text-right">Vendas</th>
                <th className="text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {(attr ?? []).map((a) => (
                <tr key={a.tipo_atribuicao} className="border-b border-border/40">
                  <td className="py-2 font-medium">{a.tipo_atribuicao}</td>
                  <td className="text-right">{fmtNum(a.total)}</td>
                  <td className="text-right text-muted-foreground">
                    {Number(a.receita).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Método de match">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Método</th>
                <th className="text-right">Total</th>
                <th className="text-right">Pré-venda</th>
                <th className="text-right">Posterior</th>
                <th className="text-right">Lag médio</th>
              </tr>
            </thead>
            <tbody>
              {(matches ?? []).map((m) => (
                <tr key={m.match_method} className="border-b border-border/40">
                  <td className="py-2 font-medium">{MATCH_METHOD_LABEL[m.match_method] ?? m.match_method}</td>
                  <td className="text-right">{fmtNum(m.total)}</td>
                  <td className="text-right text-emerald-400">{fmtNum(m.pre_sale)}</td>
                  <td className="text-right text-amber-400">{fmtNum(m.posterior)}</td>
                  <td className="text-right text-muted-foreground">{m.avg_lag != null ? `${m.avg_lag}d` : "—"}</td>
                </tr>
              ))}
              {(matches ?? []).length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">Nenhum match registrado.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <KpiCard label="Erros" value={fmtNum(errors)} accent="#ef4444" hint={<span className="flex items-center gap-1"><AlertTriangle className="size-3" />ação requerida</span>} />
        <KpiCard label="Avisos" value={fmtNum(warns)} accent="#f59e0b" />
        <KpiCard label="Informativos" value={fmtNum(infos)} accent="#94a3b8" hint={<span className="flex items-center gap-1"><ShieldCheck className="size-3" />sem bloqueio</span>} />
      </div>

      <Card title="Achados de qualidade de dados">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left py-2">Regra</th>
              <th className="text-left">Severidade</th>
              <th className="text-right">Ocorrências</th>
              <th className="text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {(dq ?? []).map((d) => (
              <tr key={d.rule + d.severity} className="border-b border-border/40">
                <td className="py-2 font-medium">{RULE_LABELS[d.rule] ?? d.rule}</td>
                <td>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${SEVERITY_BADGE[d.severity]}`}>{d.severity}</span>
                </td>
                <td className="text-right">{fmtNum(d.total)}</td>
                <td className="text-right">
                  <button
                    onClick={() => setOpenRule(openRule === d.rule ? null : d.rule)}
                    className="text-xs text-primary hover:underline"
                  >
                    {openRule === d.rule ? "Fechar" : "Inspecionar"}
                  </button>
                </td>
              </tr>
            ))}
            {(dq ?? []).length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">Nenhum achado de DQ. ✓</td></tr>
            )}
          </tbody>
        </table>

        {openRule && findings && (
          <div className="mt-4 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground mb-2">
              Mostrando até 200 ocorrências mais recentes — <span className="font-mono">{openRule}</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-muted-foreground sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5">Entidade</th>
                    <th className="text-left">ID</th>
                    <th className="text-left">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((f) => (
                    <tr key={f.id} className="border-b border-border/30">
                      <td className="py-1.5 text-muted-foreground">{f.entity}</td>
                      <td className="font-mono text-[10px]">{f.entity_id}</td>
                      <td className="font-mono text-[10px] text-muted-foreground">{JSON.stringify(f.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
