// Supabase Database Client
// Schema types and database operations for audit framework

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export database types and operations
export type { Database } from './schema';
export { auditQueries } from './queries/audits';
export { metricsQueries } from './queries/metrics';
export { findingsQueries } from './queries/findings';
export { recommendationsQueries } from './queries/recommendations';
