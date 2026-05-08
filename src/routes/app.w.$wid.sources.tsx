import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listSources, importSheet, deleteSource, previewRows, listColumns } from "@/lib/bi-api";
import { parseFile, inferType, type ParsedSheet } from "@/lib/sheet-parser";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Eye, Database, Network } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/w/$wid/sources")({
  head: () => ({ meta: [{ title: "Fontes · BI" }] }),
  component: SourcesPage,
});

function SourcesPage() {
  const { wid } = Route.useParams();
  const qc = useQueryClient();
  const { data: sources = [] } = useQuery({ queryKey: ["bi-sources", wid], queryFn: () => listSources(wid) });
  const [parsing, setParsing] = useState(false);
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [editName, setEditName] = useState("");
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});

  const onFile = async (file: File) => {
    setParsing(true);
    try {
      const ss = await parseFile(file);
      setSheets(ss);
      setSelectedSheet(0);
      const first = ss[0];
      setEditName(first?.name ?? file.name);
      const types: Record<string, string> = {};
      for (const h of first?.headers ?? []) {
        types[h] = inferType(first.rows.slice(0, 100).map(r => r[h]));
      }
      setColumnTypes(types);
    } catch (e: any) { toast.error(e.message ?? "Erro ao ler arquivo"); }
    finally { setParsing(false); }
  };

  const importMut = useMutation({
    mutationFn: async () => {
      const sh = sheets[selectedSheet];
      const cols = sh.headers.map(name => ({ name, type: columnTypes[name] ?? "text" }));
      return importSheet({ workspace_id: wid, name: editName.trim() || sh.name, columns: cols, rows: sh.rows });
    },
    onSuccess: () => {
      toast.success("Planilha importada");
      setSheets([]);
      qc.invalidateQueries({ queryKey: ["bi-sources", wid] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const delMut = useMutation({
    mutationFn: deleteSource,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bi-sources", wid] }); toast.success("Removida"); },
  });

  const sh = sheets[selectedSheet];

  return (
    <>
      <PageHeader title="Fontes de dados" subtitle="Importe planilhas para modelar e cruzar." actions={
        <Link to="/app/w/$wid/model" params={{ wid }} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
          <Network className="size-4" /> Abrir modelagem
        </Link>
      } />

      <Card title="Importar planilha (XLSX, CSV)">
        <input type="file" accept=".xlsx,.xls,.csv,.tsv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-2 file:text-sm" />
        {parsing && <div className="mt-3 text-sm text-muted-foreground">Lendo arquivo...</div>}
        {sh && (
          <div className="mt-4 space-y-3">
            {sheets.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">Aba:</span>
                {sheets.map((s, i) => (
                  <button key={i} onClick={() => { setSelectedSheet(i); setEditName(s.name); }}
                    className={`px-3 py-1 text-xs rounded-md border ${i === selectedSheet ? "bg-primary/15 border-primary/40" : "border-border"}`}>{s.name}</button>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">Nome da fonte</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 max-w-md" />
            </div>
            <div className="text-xs text-muted-foreground">{sh.rows.length} linhas · {sh.headers.length} colunas</div>
            <div className="overflow-auto max-h-80 border border-border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>{sh.headers.map(h => (
                    <th key={h} className="text-left px-2 py-1 font-medium">
                      <div>{h}</div>
                      <select value={columnTypes[h] ?? "text"} onChange={(e) => setColumnTypes({ ...columnTypes, [h]: e.target.value })}
                        className="text-[10px] bg-background border border-border rounded px-1 py-0.5 mt-1 font-normal">
                        <option value="text">texto</option><option value="number">número</option>
                        <option value="date">data</option><option value="boolean">booleano</option>
                      </select>
                    </th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sh.rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border/40">
                      {sh.headers.map(h => <td key={h} className="px-2 py-1 truncate max-w-[200px]">{String(r[h] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => importMut.mutate()} disabled={importMut.isPending}>
                <Upload className="size-4" /> Importar
              </Button>
              <Button variant="outline" onClick={() => setSheets([])}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>

      <Card title={`Suas fontes (${sources.length})`}>
        {sources.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma fonte ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map(s => <SourceCard key={s.id} source={s} onDelete={() => delMut.mutate(s.id)} />)}
          </div>
        )}
      </Card>
    </>
  );
}

function SourceCard({ source, onDelete }: { source: any; onDelete: () => void }) {
  const [show, setShow] = useState(false);
  const { data: cols = [] } = useQuery({ queryKey: ["bi-cols", source.id], queryFn: () => listColumns(source.id), enabled: show });
  const { data: rows = [] } = useQuery({ queryKey: ["bi-rows", source.id], queryFn: () => previewRows(source.id, 25), enabled: show });
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2"><Database className="size-4 text-primary" /><div className="font-medium truncate">{source.name}</div></div>
        <div className="flex gap-1">
          <button onClick={() => setShow(s => !s)} className="size-7 rounded hover:bg-accent flex items-center justify-center" title="Visualizar"><Eye className="size-4" /></button>
          <button onClick={onDelete} className="size-7 rounded hover:bg-accent text-destructive flex items-center justify-center" title="Remover"><Trash2 className="size-4" /></button>
        </div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{source.row_count} linhas</div>
      {show && (
        <div className="mt-3 max-h-64 overflow-auto border border-border rounded text-[11px]">
          <table className="w-full">
            <thead className="bg-muted/40 sticky top-0"><tr>{cols.map(c => <th key={c.id} className="text-left px-1.5 py-1">{c.name}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i} className="border-t border-border/40">{cols.map(c => <td key={c.id} className="px-1.5 py-1 truncate max-w-[120px]">{String(r[c.name] ?? "")}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
