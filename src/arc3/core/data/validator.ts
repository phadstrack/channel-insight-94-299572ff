import type { NormalizedData } from '../../types';

export class DataValidator {
  static validate(data: NormalizedData[]): { valid: NormalizedData[]; errors: string[] } {
    const valid: NormalizedData[] = [];
    const errors: string[] = [];

    for (const row of data) {
      if (!row.audit_id || !row.date || !row.metric || row.value === undefined) {
        errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
      } else {
        valid.push(row);
      }
    }

    return { valid, errors };
  }
}
