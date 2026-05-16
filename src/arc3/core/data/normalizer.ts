import type { RawData, NormalizedData } from '../../types';

export class DataNormalizer {
  static normalize(auditId: string, raw: RawData): NormalizedData[] {
    const normalized: NormalizedData[] = [];

    // Placeholder: transforma RawData em NormalizedData
    // Cada row fica: { audit_id, date, channel, metric, value, quality_score }

    return normalized;
  }
}
