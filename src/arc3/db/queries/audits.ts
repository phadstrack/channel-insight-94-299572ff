import { supabase } from '../client';

export const auditQueries = {
  create: async (auditData: any) => {
    return supabase.from('arc3_audits').insert([auditData]);
  },
  list: async () => {
    return supabase.from('arc3_audits').select('*');
  },
  getById: async (id: string) => {
    return supabase.from('arc3_audits').select('*').eq('id', id).single();
  },
};
