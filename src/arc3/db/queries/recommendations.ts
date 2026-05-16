import { supabase } from '../client';

export const recommendationsQueries = {
  create: async (recData: any) => {
    return supabase.from('arc3_recommendations').insert([recData]);
  },
  byAudit: async (auditId: string) => {
    return supabase.from('arc3_recommendations').select('*').eq('audit_id', auditId);
  },
};
