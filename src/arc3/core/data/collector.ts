import type { RawData } from '../../types';

export class DataCollector {
  static async fromCSV(auditId: string, filePath: string): Promise<RawData> {
    return {
      source: 'csv',
      content: [],
      metadata: { file_name: filePath },
    };
  }

  static async fromJSON(auditId: string, url: string): Promise<RawData> {
    return {
      source: 'json',
      content: [],
      metadata: { url },
    };
  }

  static async fromMetaAds(auditId: string, token: string): Promise<RawData> {
    return {
      source: 'meta_ads',
      content: [],
      metadata: {},
    };
  }

  static async fromGoogleAds(auditId: string, credentials: any): Promise<RawData> {
    return {
      source: 'google_ads',
      content: [],
      metadata: {},
    };
  }
}
