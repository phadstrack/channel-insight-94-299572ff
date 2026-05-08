import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node, type NodeChange, applyNodeChanges } from "reactflow";
import "reactflow/dist/style.css";
import {
  ensureDefaultModel, listSources, listNodes, listRelationships, listColumnsForSources,
  upsertNode, removeNode, deleteRelationship, toggleRelationship,
} from "@/lib/bi-api";
import { SourceNode, type SourceNodeData } from "@/components/bi/SourceNode";
import { RelationshipModal } from "@/components/bi/RelationshipModal";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/w/$wid/model")({
  head: () => ({ meta: [{ title: "Modelagem · BI" }] }),
  component: ModelPage,
});

const nodeTypes = { source: SourceNode };

function ModelPage() {
  const { wid } = Route.useParams();
  const qc = useQueryClient();
  const { data: model } = useQuery({ queryKey: ["bi-model", wid], queryFn: () => ensureDefaultModel(wid) });
  const modelId = model?.id;
  const { data: sources = [] } = useQuery({ queryKey: ["bi-sources", wid], queryFn: () => listSources(wid) });
  const { data: nodesDB = [] } = useQuery({ queryKey: ["bi-nodes", modelId], queryFn: () => listNodes(modelId!), enabled: !!modelId });
  const { data: relsData } = useQuery({ queryKey: ["bi-rels", modelId], queryFn: () => listRelationships(modelId!), enabled: !!modelId });
  const sourceIds = useMemo(() => nodesDB.map(n => n.source_id), [nodesDB]);
  const { data: cols = [] } = useQuery({
    queryKey: ["bi-cols-bulk", sourceIds.join(",")],
    queryFn: () => listColumnsForSources(sourceIds),
    enabled: sourceIds.length > 0,
  });

  const [nodes, setNodes] = useState<Node[]>([]);
  const [pickerFrom, setPickerFrom] = useState<string | null>(null);
  const [pickerTo, setPickerTo] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  // Build nodes from DB + sources + columns
  useEffect(() => {
    const colsBySource = cols.reduce<Record<string, typeof cols>>((acc, c) => {
      (acc[c.source_id] ||= []).push(c); return acc;
    }, {});
    const ns: Node<SourceNodeData>[] = nodesDB.map(n => {
      const src = sources.find(s => s.id === n.source_id);
      return {
        id: n.source_id,
        type: "source",
        position: { x: Number(n.x), y: Number(n.y) },
        data: {
          name: src?.name ?? "?",
          columns: colsBySource[n.source_id] ?? [],
          onRemove: () => removeMut.mutate(n.source_id),
          onConnect: () => setPickerFrom(n.source_id),
        },
      };
    });
    setNodes(ns);
  }, [nodesDB, sources, cols]);

  const upsertMut = useMutation({ mutationFn: upsertNode });
  const removeMut = useMutation({
    mutationFn: (sid: string) => removeNode(modelId!, sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bi-nodes", modelId] }),
  });
  const delRel = useMutation({
    mutationFn: deleteRelationship,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bi-rels", modelId] }); setSelectedEdge(null); toast.success("Relacionamento removido"); },
  });
  const togRel = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleRelationship(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bi-rels", modelId] }),
  });

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(ns => {
      const next = applyNodeChanges(changes, ns);
      for (const c of changes) {
        if (c.type === "position" && !c.dragging && c.position && modelId) {
          upsertMut.mutate({ model_id: modelId, source_id: c.id, x: c.position.x, y: c.position.y });
        }
      }
      return next;
    });
  }, [modelId, upsertMut]);

  const edges: Edge[] = useMemo(() => {
    if (!relsData) return [];
    const colsByRel = relsData.cols.reduce<Record<string, typeof relsData.cols>>((acc, c) => {
      (acc[c.relationship_id] ||= []).push(c); return acc;
    }, {});
    return relsData.rels.map(r => {
      const pairs = colsByRel[r.id] ?? [];
      const label = pairs.length > 1 ? `${pairs.length} cols (${cardLabel(r.cardinality)})` : `${pairs[0]?.from_col ?? "?"} = ${pairs[0]?.to_col ?? "?"} · ${cardLabel(r.cardinality)}`;
      return {
        id: r.id, source: r.from_source, target: r.to_source,
        label, animated: r.active,
        style: { stroke: r.active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", strokeWidth: 2, strokeDasharray: r.active ? undefined : "4 4" },
        labelStyle: { fontSize: 10, fill: "hsl(var(--foreground))" },
        labelBgStyle: { fill: "hsl(var(--card))" },
      };
    });
  }, [relsData]);

  const selectedRel = relsData?.rels.find(r => r.id === selectedEdge);

  const sourcesNotInCanvas = sources.filter(s => !sourceIds.includes(s.id));
  const addToCanvas = (sid: string) => {
    if (!modelId) return;
    upsertMut.mutate({ model_id: modelId, source_id: sid, x: Math.random() * 400, y: Math.random() * 200 }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["bi-nodes", modelId] }),
    });
  };

  return (
    <>
      <PageHeader title="Modelagem visual" subtitle="Arraste tabelas e conecte por colunas (chave simples ou composta)." actions={
        <Link to="/app/w/$wid/sources" params={{ wid }} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
          <ArrowLeft className="size-4" /> Fontes
        </Link>
      } />
      <div className="grid grid-cols-[240px_1fr] gap-3" style={{ height: "calc(100vh - 220px)" }}>
        <div className="rounded-xl border border-border bg-card p-3 overflow-auto">
          <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Adicionar ao canvas</div>
          {sourcesNotInCanvas.length === 0 ? (
            <div className="text-xs text-muted-foreground">Todas as fontes já estão no canvas.</div>
          ) : sourcesNotInCanvas.map(s => (
            <button key={s.id} onClick={() => addToCanvas(s.id)} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent flex items-center gap-2">
              <Plus className="size-3" /> <span className="truncate">{s.name}</span>
            </button>
          ))}
          {selectedRel && (
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Relacionamento</div>
              <div className="text-xs">{cardLabel(selectedRel.cardinality)} · {selectedRel.direction === "both" ? "bidirecional" : "unidirecional"}</div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => togRel.mutate({ id: selectedRel.id, active: !selectedRel.active })}>
                <Power className="size-3" /> {selectedRel.active ? "Desativar" : "Ativar"}
              </Button>
              <Button size="sm" variant="outline" className="w-full text-destructive" onClick={() => delRel.mutate(selectedRel.id)}>
                <Trash2 className="size-3" /> Remover
              </Button>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgeClick={(_e, ed) => setSelectedEdge(ed.id)}
            onPaneClick={() => setSelectedEdge(null)}
            fitView
          >
            <Background gap={16} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </div>

      {pickerFrom && !pickerTo && (
        <PickTargetModal
          fromName={sources.find(s => s.id === pickerFrom)?.name ?? ""}
          choices={sources.filter(s => sourceIds.includes(s.id) && s.id !== pickerFrom)}
          onPick={setPickerTo}
          onClose={() => setPickerFrom(null)}
        />
      )}
      {pickerFrom && pickerTo && modelId && (
        <RelationshipModal
          open
          onClose={() => { setPickerFrom(null); setPickerTo(null); }}
          modelId={modelId}
          fromSource={pickerFrom} toSource={pickerTo}
          fromName={sources.find(s => s.id === pickerFrom)?.name ?? ""}
          toName={sources.find(s => s.id === pickerTo)?.name ?? ""}
          onCreated={() => qc.invalidateQueries({ queryKey: ["bi-rels", modelId] })}
        />
      )}
    </>
  );
}

function PickTargetModal({ fromName, choices, onPick, onClose }: {
  fromName: string; choices: { id: string; name: string }[]; onPick: (id: string) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-semibold mb-3">Conectar <span className="text-primary">{fromName}</span> a...</div>
        {choices.length === 0 ? (
          <div className="text-xs text-muted-foreground">Adicione outra tabela ao canvas para conectar.</div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-auto">
            {choices.map(c => (
              <button key={c.id} onClick={() => onPick(c.id)} className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm">{c.name}</button>
            ))}
          </div>
        )}
        <div className="mt-3 text-right"><Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button></div>
      </div>
    </div>
  );
}

function cardLabel(c: string) {
  return ({ one_one: "1:1", one_many: "1:N", many_one: "N:1", many_many: "N:N" } as any)[c] ?? c;
}
