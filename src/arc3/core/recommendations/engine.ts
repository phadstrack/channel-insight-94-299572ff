import type { Finding, Recommendation } from '../../types';

export class RecommendationEngine {
  static generate(auditId: string, findings: Finding[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const finding of findings) {
      recommendations.push({
        id: `rec-${Date.now()}`,
        finding_id: finding.id,
        title: `Action for: ${finding.title}`,
        description: `Address ${finding.title}`,
        priority_score: 50,
        impact_estimate: finding.impact_estimate,
        estimated_effort: 'medium',
        estimated_effort_days: 5,
        owner_role: 'data-engineer',
        implementation_steps: ['Step 1', 'Step 2'],
        status: 'pending',
      });
    }

    return recommendations;
  }
}
