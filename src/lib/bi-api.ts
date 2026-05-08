import { supabase } from "@/integrations/supabase/client";

export type Workspace = { id: string; name: string; owner_id: string; created_at: string };
export type DsSource = { id: string; workspace_id: string; name: string; row_count: number; updated_at: string };
export type DsColumn = { id: string; source_id: string; name: string; type: string; ordinal: number };
export type DataModel = { id: string; workspace_id: string; name: string };
export type ModelNode = { id: string; model_id: string; source_id: string; x: number; y: number };
export type Relationship = {
  id: string; model_id: string; from_source: string; to_source: string;
  cardinality: "one_one" | "one_many" | "many_one" | "many_many";
  direction: "single" | "both"; active: boolean;
};
export type RelColumn = { id: string; relationship_id: string; from_col: string; to_col: string; ord: number };

export async function listWorkspaces() {
  const { data, error } = await supabase.from("workspaces").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Workspace[];
}

export async function createWorkspace(name: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const { data, error } = await supabase.from("workspaces").insert({ name, owner_id: u.user.id }).select("*").single();
  if (error) throw error;
  return data as Workspace;
}

export async function listSources(workspace_id: string) {
  const { data, error } = await supabase.from("ds_sources").select("*").eq("workspace_id", workspace_id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DsSource[];
}

export async function listColumns(source_id: string) {
  const { data, error } = await supabase.from("ds_columns").select("*").eq("source_id", source_id).order("ordinal");
  if (error) throw error;
  return (data ?? []) as DsColumn[];
}

export async function listColumnsForSources(source_ids: string[]) {
  if (!source_ids.length) return [] as DsColumn[];
  const { data, error } = await supabase.from("ds_columns").select("*").in("source_id", source_ids).order("ordinal");
  if (error) throw error;
  return (data ?? []) as DsColumn[];
}

export async function importSheet(p: { workspace_id: string; name: string; columns: { name: string; type: string }[]; rows: Record<string, unknown>[] }) {
  const { data, error } = await supabase.rpc("import_sheet", {
    p_workspace_id: p.workspace_id, p_name: p.name, p_columns: p.columns as any, p_rows: p.rows as any,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteSource(id: string) {
  const { error } = await supabase.from("ds_sources").delete().eq("id", id);
  if (error) throw error;
}

export async function previewRows(source_id: string, limit = 50) {
  const { data, error } = await supabase.from("ds_rows").select("data").eq("source_id", source_id).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.data as Record<string, unknown>);
}

export async function listModels(workspace_id: string) {
  const { data, error } = await supabase.from("data_models").select("*").eq("workspace_id", workspace_id).order("created_at");
  if (error) throw error;
  return (data ?? []) as DataModel[];
}

export async function ensureDefaultModel(workspace_id: string) {
  const existing = await listModels(workspace_id);
  if (existing.length) return existing[0];
  const { data, error } = await supabase.from("data_models").insert({ workspace_id, name: "Modelo padrão" }).select("*").single();
  if (error) throw error;
  return data as DataModel;
}

export async function listNodes(model_id: string) {
  const { data, error } = await supabase.from("model_nodes").select("*").eq("model_id", model_id);
  if (error) throw error;
  return (data ?? []) as ModelNode[];
}

export async function upsertNode(n: { model_id: string; source_id: string; x: number; y: number }) {
  const { error } = await supabase.from("model_nodes").upsert(n, { onConflict: "model_id,source_id" });
  if (error) throw error;
}

export async function removeNode(model_id: string, source_id: string) {
  const { error } = await supabase.from("model_nodes").delete().eq("model_id", model_id).eq("source_id", source_id);
  if (error) throw error;
}

export async function listRelationships(model_id: string) {
  const { data: rels, error } = await supabase.from("relationships").select("*").eq("model_id", model_id);
  if (error) throw error;
  const ids = (rels ?? []).map((r: any) => r.id);
  let cols: RelColumn[] = [];
  if (ids.length) {
    const { data: c, error: e2 } = await supabase.from("relationship_columns").select("*").in("relationship_id", ids).order("ord");
    if (e2) throw e2;
    cols = (c ?? []) as RelColumn[];
  }
  return { rels: (rels ?? []) as Relationship[], cols };
}

export async function createRelationship(args: {
  model_id: string; from_source: string; to_source: string;
  cardinality: Relationship["cardinality"]; direction: Relationship["direction"];
  pairs: { from_col: string; to_col: string }[];
}) {
  const { data: rel, error } = await supabase.from("relationships").insert({
    model_id: args.model_id, from_source: args.from_source, to_source: args.to_source,
    cardinality: args.cardinality, direction: args.direction, active: true,
  }).select("*").single();
  if (error) throw error;
  const inserts = args.pairs.map((p, i) => ({ relationship_id: rel.id, from_col: p.from_col, to_col: p.to_col, ord: i }));
  const { error: e2 } = await supabase.from("relationship_columns").insert(inserts);
  if (e2) throw e2;
  return rel as Relationship;
}

export async function deleteRelationship(id: string) {
  const { error } = await supabase.from("relationships").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleRelationship(id: string, active: boolean) {
  const { error } = await supabase.from("relationships").update({ active }).eq("id", id);
  if (error) throw error;
}

export type ValidateResult = {
  total_left: number; total_right: number;
  matched_left: number; matched_right: number;
  cardinality: Relationship["cardinality"];
};

export async function validateRelationship(args: { from_source: string; to_source: string; pairs: { from_col: string; to_col: string }[] }) {
  const { data, error } = await supabase.rpc("validate_relationship", {
    p_from_source: args.from_source, p_to_source: args.to_source, p_pairs: args.pairs as any,
  });
  if (error) throw error;
  return data as ValidateResult;
}
