import type { AuditSession, Metrics, Finding, Recommendation, Report } from '../../types';

export class ReportGenerator {
  static generate(
    audit: AuditSession,
    metrics: Metrics,
    findings: Finding[],
    recommendations: Recommendation[]
  ): Report {
    return {
      id: `report-${Date.now()}`,
      audit_id: audit.id,
      generated_at: new Date(),
      metrics,
      findings,
      recommendations,
      summary: 'Audit report summary',
    };
  }

  static toHTML(report: Report): string {
    return `<html><!-- Report --></html>`;
  }

  static toJSON(report: Report): string {
    return JSON.stringify(report);
  }
}
