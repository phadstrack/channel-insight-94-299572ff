import type { AuditSession as IAuditSession } from '../../types';

export class AuditSession {
  static create(clientName: string, objectives: string[]): IAuditSession {
    return {
      id: `audit-${Date.now()}`,
      client_name: clientName,
      objectives,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
      started_at: null,
      completed_at: null,
    };
  }

  static async load(id: string): Promise<IAuditSession | null> {
    // Placeholder: carregará do banco
    return null;
  }

  static async update(audit: IAuditSession): Promise<void> {
    // Placeholder: salvará no banco
  }
}
