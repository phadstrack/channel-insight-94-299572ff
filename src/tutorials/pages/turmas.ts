import type { Tutorial } from "../types";

export const turmasTutorial: Tutorial = {
  key: "turmas",
  steps: [
    {
      title: "Análise por Turmas 🎓",
      description:
        "Compare a performance de cada turma lado a lado: receita, número de vendas e ticket médio.",
    },
    {
      element: "[data-tour='filters']",
      title: "Recorte por período",
      description:
        "Use o filtro de data para isolar uma janela específica (ex.: lançamento de uma turma). O filtro de Turma permite focar em uma única.",
      side: "bottom",
    },
    {
      title: "Drilldown por canal",
      description:
        "Cada turma quebra a receita pelos <b>canais de atribuição</b>. Isso mostra de onde vieram os alunos de cada uma.",
    },
  ],
};
