import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { listColumns, validateRelationship, createRelationship, type Relationship } from "@/lib/bi-api";
import { Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Pair = { from_col: string; to_col: string };

export function RelationshipModal({
  open, onClose, modelId, fromSource, toSource, fromName, toName, onCreated,
}: {
  open: boolean; onClose: () => void; modelId: string;
  fromSource: string; toSource: string; fromName: string; toName: string;
  onCreated: () => void;
}) {
  const { data: leftCols = [] } = useQuery({ queryKey: ["bi-cols", fromSource], queryFn: () => listColumns(fromSource), enabled: open });
  const { data: rightCols = [] } = useQuery({ queryKey: ["bi-cols", toSource], queryFn: () => listColumns(toSource), enabled: open });
  const [pairs, setPairs] = useState<Pair[]>([{ from_col: "", to_col: "" }]);
  const [validation, setValidation] = useState<any>(null);
  const [direction, setDirection] = useState<Relationship["direction"]>("single");

  useEffect(() => { if (open) { setPairs([{ from_col: "", to_col: "" }]); setValidation(null); } }, [open]);

  const validate = useMutation({
    mutationFn: () => validateRelationship({
      from_source: fromSource, to_source: toSource,
      pairs: pairs.filter(p => p.from_col && p.to_col),
    }),
    onSuccess: setValidation,
    onError: (e: any) => toast.error(e.message ?? "Erro na validação"),
  });

  const create = useMutation({
    mutationFn: () => createRelationship({
      model_id: modelId, from_source: fromSource, to_source: toSource,
      cardinality: validation?.cardinality ?? "one_many",
      direction,
      pairs: pairs.filter(p => p.from_col && p.to_col),
    }),
    onSuccess: () => { toast.success("Relacionamento criado"); onCreated(); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });

  const valid = pairs.some(p => p.from_col && p.to_col);
  const pctL = validation && validation.total_left ? (validation.matched_left / validation.total_left) * 100 : 0;
  const pctR = validation && validation.total_right ? (validation.matched_right / validation.total_right) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Relacionar <span className="text-primary">{fromName}</span> → <span className="text-primary">{toName}</span></DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Adicione um par de colunas para relacionamento simples, ou múltiplos pares para chave composta (ex.: e-mail + telefone).
          </div>

          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={p.from_col} onChange={(e) => setPairs(pairs.map((x, j) => j === i ? { ...x, from_col: e.target.value } : x))}
                className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm">
                <option value="">— coluna em {fromName} —</option>
                {leftCols.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <span className="text-muted-foreground text-sm">=</span>
              <select value={p.to_col} onChange={(e) => setPairs(pairs.map((x, j) => j === i ? { ...x, to_col: e.target.value } : x))}
                className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm">
                <option value="">— coluna em {toName} —</option>
                {rightCols.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {pairs.length > 1 && (
                <button onClick={() => setPairs(pairs.filter((_, j) => j !== i))} className="size-8 rounded hover:bg-accent flex items-center justify-center"><X className="size-4" /></button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPairs([...pairs, { from_col: "", to_col: "" }])}>
            <Plus className="size-3" /> Adicionar par (chave composta)
          </Button>

          <div className="pt-2 border-t border-border flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => validate.mutate()} disabled={!valid || validate.isPending}>
              {validate.isPending ? "Validando..." : "Validar match"}
            </Button>
            <label className="ml-auto text-xs flex items-center gap-2">
              Direção do filtro:
              <select value={direction} onChange={(e) => setDirection(e.target.value as any)} className="bg-background border border-border rounded px-2 py-1 text-xs">
                <option value="single">unidirecional</option>
                <option value="both">bidirecional</option>
              </select>
            </label>
          </div>

          {validation && (
            <div className="rounded-md bg-muted/40 p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {pctL > 50 ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" />}
                <span>Cardinalidade detectada: <b>{cardLabel(validation.cardinality)}</b></span>
              </div>
              <MatchBar label={fromName} matched={validation.matched_left} total={validation.total_left} />
              <MatchBar label={toName} matched={validation.matched_right} total={validation.total_right} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={!valid || create.isPending}>Criar relacionamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchBar({ label, matched, total }: { label: string; matched: number; total: number }) {
  const pct = total ? (matched / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{matched.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${pct > 70 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function cardLabel(c: string) {
  return ({ one_one: "1 : 1", one_many: "1 : N", many_one: "N : 1", many_many: "N : N" } as any)[c] ?? c;
}
