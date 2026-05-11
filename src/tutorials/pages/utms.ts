import type { Tutorial } from "../types";

export const utmsTutorial: Tutorial = {
  key: "utms",
  steps: [
    {
      title: "Análise de Campanhas (UTMs) 🏷️",
      description:
        "Veja a performance hierárquica das UTMs: <b>campanha → conteúdo → origem → mídia</b>. Cada nível detalha o anterior.",
    },
    {
      element: "[data-tour='filters']",
      title: "Filtros + UTMs",
      description:
        "Combine os filtros globais com a hierarquia UTM para responder perguntas como 'qual conteúdo da campanha X gerou mais receita no estado Y'.",
      side: "bottom",
    },
    {
      title: "Identifique vencedores",
      description:
        "Use a coluna de receita para identificar rapidamente os criativos e canais que mais convertem. Replique o que funciona, descontinue o que não funciona.",
    },
  ],
};
