import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';

// Placeholder data - em produção viria do banco
const audits = [
  {
    id: '1',
    clientName: 'Acme Corp',
    status: 'completed',
    problemsCount: 5,
    progressCount: 12,
    plansCount: 8,
    createdAt: '2026-05-10',
  },
  {
    id: '2',
    clientName: 'TechStartup Inc',
    status: 'in_progress',
    problemsCount: 3,
    progressCount: 8,
    plansCount: 6,
    createdAt: '2026-05-15',
  },
];

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-700',
  in_progress: 'bg-blue-500/10 text-blue-700',
  draft: 'bg-gray-500/10 text-gray-700',
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditorias ARC3</h1>
        <p className="text-muted-foreground mt-2">Gerenciamento centralizado de auditorias de vendas, dados e marketing</p>
      </div>

      {audits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma auditoria criada ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {audits.map((audit) => (
            <Link key={audit.id} to={`/auditoria/${audit.id}`}>
              <Card className="hover:border-foreground cursor-pointer transition">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{audit.clientName}</CardTitle>
                      <CardDescription>{audit.createdAt}</CardDescription>
                    </div>
                    <Badge className={statusColors[audit.status]}>
                      {audit.status === 'completed' && 'Completa'}
                      {audit.status === 'in_progress' && 'Em andamento'}
                      {audit.status === 'draft' && 'Rascunho'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Problemas encontrados</p>
                      <p className="text-2xl font-bold text-red-600">{audit.problemsCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Progressos identificados</p>
                      <p className="text-2xl font-bold text-green-600">{audit.progressCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Planos recomendados</p>
                      <p className="text-2xl font-bold text-blue-600">{audit.plansCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
