/**
 * ARC3 Marketing Audit Framework
 *
 * A complete, reusable framework for marketing and data audits
 * with 10 specialized skills integrated.
 *
 * Version: 0.1.0 (MVP Phase 1)
 */

// Export all types
export * from './types';

// Export core modules
export { AuditSession } from './core/audit';
export { DataCollector, DataNormalizer, DataValidator } from './core/data';
export { MetricsCalculator } from './core/analysis';
export { TrackingAuditor } from './core/tracking';
export { FindingsDetector } from './core/findings';
export { RecommendationEngine } from './core/recommendations';
export { ReportGenerator } from './core/reports';

// Export skills
export { SkillOrchestrator } from './skills';

// Export integrations
export * from './integrations';

// Export db
export * from './db';

// Export utils
export * from './utils';
