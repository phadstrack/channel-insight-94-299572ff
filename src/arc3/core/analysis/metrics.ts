import type { NormalizedData, Metrics } from '../../types';

export class MetricsCalculator {
  static calculate(data: NormalizedData[]): Metrics {
    return {
      roas: 0,
      cpa: 0,
      cac: 0,
      cpc: 0,
      cpm: 0,
      ctr: 0,
      cvr: 0,
      impression_share: 0,
      previous_period_delta: 0,
      yoy_change: 0,
    };
  }
}
