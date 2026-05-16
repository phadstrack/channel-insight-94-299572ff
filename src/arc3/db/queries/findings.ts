import { supabase } from '../client';

export const findingsQueries = {
  create: async (findingData: any) => {
    return supabase.from('arc3_findings').insert([findingData]);
  },
  byAudit: async (auditId: string) => {
    return supabase.from('arc3_findings').select('*').eq('audit_id', auditId);
  },
};
