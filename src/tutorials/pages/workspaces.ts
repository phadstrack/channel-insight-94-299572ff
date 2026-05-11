import type { Tutorial } from "../types";

export const workspacesTutorial: Tutorial = {
  key: "workspaces",
  steps: [
    {
      title: "BI Workspaces (beta) 🧪",
      description:
        "Aqui você cria <b>análises customizadas</b> trazendo suas próprias planilhas, definindo relacionamentos entre elas e construindo queries no estilo Power BI/Looker.",
    },
    {
      title: "1. Crie um workspace",
      description:
        "Cada workspace é um ambiente isolado de análise. Dê um nome (ex.: 'Performance Q1 2026') e convide colaboradores se quiser.",
    },
    {
      title: "2. Importe fontes",
      description:
        "Em <b>Sources</b> você sobe planilhas (CSV/Excel) que serão suas tabelas. Cada fonte vira uma 'tabela' navegável.",
    },
    {
      title: "3. Modele relações",
      description:
        "Em <b>Model</b> você arrasta as fontes e desenha os relacionamentos entre elas (1:N, N:1, etc.) — igual ao Power BI.",
    },
    {
      title: "4. Construa queries",
      description:
        "Com o modelo pronto, o Query Builder permite agrupar, filtrar e agregar dados sem escrever SQL.",
    },
  ],
};
