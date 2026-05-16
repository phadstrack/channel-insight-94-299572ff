import { useParams } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Target } from 'lucide-react';

// Placeholder data
const placeholderAudit = {
  id: '1',
  clientName: 'Acme Corp',
  status: 'completed',
  createdAt: '2026-05-10',
  problemas: [
    {
      id: '1',
      title: 'Pixel Meta faltando',
      severity: 'critical',
      description: 'Pixel de conversão do Meta não está configurado em algumas páginas',
      impact: '~20% de conversões não rastreadas',
    },
    {
      id: '2',
      title: 'UTM inconsistente',
      severity: 'high',
      description: 'UTMs com variações de case (Campaign vs campaign)',
      impact: '~5% de dados duplicados',
    },
    {
      id: '3',
      title: 'GA4 eventos incompletos',
      severity: 'medium',
      description: 'Alguns eventos GA4 faltando parâmetros obrigatórios',
      impact: '~2% de perda de dados',
    },
  ],
  progressos: [
    {
      title: 'Google Ads ROAS',
      value: '2.8x',
      trend: '+12% MoM',
      color: 'text-green-600',
    },
    {
      title: 'Organic Revenue',
      value: '15%',
      trend: 'Estável',
      color: 'text-blue-600',
    },
    {
      title: 'Email CTR',
      value: '4.2%',
      trend: '+8% vs mês anterior',
      color: 'text-green-600',
    },
  ],
  planos: [
    {
      id: '1',
      priority: 1,
      score: 9.5,
      title: 'Implementar server-side tracking',
      impactEstimate: '+25% ROAS',
      effort: '2 dias',
      owner: 'Data Engineer',
    },
    {
      id: '2',
      priority: 2,
      score: 7.2,
      title: 'Revisar UTM governance',
      impactEstimate: '+5% accuracy',
      effort: '1 semana',
      owner: 'Marketing Manager',
    },
    {
      id: '3',
      priority: 3,
      score: 5.8,
      title: 'Configurar GA4 adequadamente',
      impactEstimate: '+3% dados rastreados',
      effort: '3 dias',
      owner: 'Tracking Expert',
    },
  ],
};

export default function AuditoriaDetail() {
  const { id } = useParams({ from: '/auditoria/$id' });

  // Em produção, carregaria os dados do banco baseado em `id`
  const audit = placeholderAudit;

  const severityColor: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-700',
    high: 'bg-orange-500/10 text-orange-700',
    medium: 'bg-yellow-500/10 text-yellow-700',
    low: 'bg-blue-500/10 text-blue-700',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{audit.clientName}</h1>
        <p className="text-muted-foreground mt-2">Auditoria de Vendas, Dados e Marketing</p>
      </div>

      {/* 3 Ps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROBLEMAS */}
        <Card className="lg:col-span-1 border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-600">Problemas</CardTitle>
            </div>
            <CardDescription>{audit.problemas.length} achados críticos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {audit.problemas.map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{p.title}</p>
                  <Badge className={severityColor[p.severity]} variant="secondary">
                    {p.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <p className="text-xs font-semibold text-red-600">{p.impact}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PROGRESSOS */}
        <Card className="lg:col-span-1 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-green-600">Progressos</CardTitle>
            </div>
            <CardDescription>Métricas em alta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audit.progressos.map((p, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-sm text-muted-foreground">{p.title}</p>
                <p className={`text-2xl font-bold ${p.color}`}>{p.value}</p>
                <p className="text-xs text-green-600">{p.trend}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PLANO */}
        <Card className="lg:col-span-1 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-600">Plano</CardTitle>
            </div>
            <CardDescription>{audit.planos.length} recomendações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {audit.planos.slice(0, 3).map((p) => (
              <div key={p.id} className="space-y-1 pb-2 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{p.title}</p>
                  <Badge className="bg-blue-500/10 text-blue-700" variant="secondary">
                    #{p.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.impactEstimate} • {p.effort}</p>
                <p className="text-xs text-blue-600">{p.owner}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed sections */}
      <div className="grid gap-6">
        {/* Detailed Problemas */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento de Problemas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {audit.problemas.map((p) => (
              <div key={p.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{p.title}</h4>
                  <Badge className={severityColor[p.severity]}>{p.severity.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                <p className="text-sm">
                  <strong>Impacto estimado:</strong> {p.impact}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Full Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Plano Completo (Priorizado)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {audit.planos.map((p) => (
              <div key={p.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prioridade {p.priority} • Score: {p.score.toFixed(1)}/10
                    </p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-700">Owner: {p.owner}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>
                    <strong>Impacto:</strong> {p.impactEstimate}
                  </p>
                  <p>
                    <strong>Esforço:</strong> {p.effort}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
