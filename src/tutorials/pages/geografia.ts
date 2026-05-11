import type { Tutorial } from "../types";

export const geografiaTutorial: Tutorial = {
  key: "geografia",
  steps: [
    {
      title: "Distribuição Geográfica 📍",
      description:
        "Veja como suas vendas se distribuem pelo Brasil — por estado e cidade.",
    },
    {
      element: "[data-tour='filters']",
      title: "Filtros aplicados",
      description:
        "Ao filtrar por <b>canal</b> ou <b>turma</b>, o mapa redesenha automaticamente. Use para responder perguntas como 'quais estados respondem melhor à campanha X?'.",
      side: "bottom",
    },
    {
      title: "Tabela de cidades",
      description:
        "Abaixo do mapa, a tabela detalha as cidades com mais vendas. Útil para planejar eventos presenciais e ações regionais.",
    },
  ],
};
