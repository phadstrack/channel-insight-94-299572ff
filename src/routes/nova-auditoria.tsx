import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function NovaAuditoria() {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);

  const objectiveOptions = [
    { id: 'increase_roas', label: 'Aumentar ROAS' },
    { id: 'reduce_cpa', label: 'Reduzir CPA' },
    { id: 'improve_tracking', label: 'Melhorar tracking' },
    { id: 'data_quality', label: 'Qualidade de dados' },
    { id: 'identify_gaps', label: 'Identificar gaps de atribuição' },
  ];

  const toggleObjective = (id: string) => {
    setObjectives((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || objectives.length === 0) {
      alert('Preencha todos os campos');
      return;
    }

    // Placeholder: aqui iria chamar AuditSession.create() e salvar no banco
    // Por enquanto, navega com ID dummy
    const auditId = `audit-${Date.now()}`;
    navigate({ to: `/auditoria/${auditId}` });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nova Auditoria</h1>
        <p className="text-muted-foreground mt-2">Crie uma nova auditoria para um cliente e defina os objetivos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Auditoria</CardTitle>
          <CardDescription>Informações básicas e objetivos da auditoria</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Name */}
            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Ex.: Acme Corp, Meu Negócio"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Objectives */}
            <div>
              <Label>Objetivos da Auditoria</Label>
              <p className="text-sm text-muted-foreground mb-3">Selecione um ou mais objetivos</p>
              <div className="space-y-3">
                {objectiveOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      checked={objectives.includes(option.id)}
                      onCheckedChange={() => toggleObjective(option.id)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1">
                Criar Auditoria
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/' })}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
