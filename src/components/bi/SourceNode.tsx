import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Database, X } from "lucide-react";
import type { DsColumn } from "@/lib/bi-api";

export type SourceNodeData = {
  name: string;
  columns: DsColumn[];
  onRemove: () => void;
  onConnect: () => void;
};

export const SourceNode = memo(({ data }: { data: SourceNodeData }) => {
  return (
    <div className="rounded-lg border-2 border-border bg-card shadow-md min-w-[220px] max-w-[260px]">
      <Handle type="target" position={Position.Left} style={{ background: "hsl(var(--primary))" }} />
      <Handle type="source" position={Position.Right} style={{ background: "hsl(var(--primary))" }} />
      <div className="px-3 py-2 border-b border-border bg-primary/10 flex items-center justify-between gap-2 rounded-t-md">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="size-3.5 text-primary shrink-0" />
          <div className="font-semibold text-xs truncate">{data.name}</div>
        </div>
        <button onClick={data.onRemove} className="size-5 rounded hover:bg-destructive/20 flex items-center justify-center text-muted-foreground" title="Tirar do canvas">
          <X className="size-3" />
        </button>
      </div>
      <div className="max-h-56 overflow-auto py-1">
        {data.columns.slice(0, 30).map(c => (
          <div key={c.id} className="px-3 py-0.5 text-[11px] flex justify-between text-foreground/80 hover:bg-accent/40">
            <span className="truncate">{c.name}</span>
            <span className="text-muted-foreground text-[10px] ml-2">{c.type}</span>
          </div>
        ))}
        {data.columns.length > 30 && <div className="px-3 py-1 text-[10px] text-muted-foreground">+{data.columns.length - 30} colunas</div>}
      </div>
      <button onClick={data.onConnect} className="w-full px-3 py-1.5 text-[11px] border-t border-border hover:bg-accent rounded-b-md text-primary font-medium">
        + Conectar
      </button>
    </div>
  );
});
SourceNode.displayName = "SourceNode";
