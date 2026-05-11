import type { Tutorial } from "../types";

export const visaoGeralTutorial: Tutorial = {
  key: "visao-geral",
  steps: [
    {
      title: "Bem-vindo à Visão Geral 👋",
      description:
        "Esta é a tela inicial. Aqui você vê os números consolidados de vendas, leads e atribuição em um só lugar. Vamos dar um tour rápido?",
    },
    {
      element: "[data-tour='filters']",
      title: "Filtros globais",
      description:
        "Use estes filtros para recortar os dados por <b>período</b>, <b>turma</b>, <b>estado</b> e <b>canal</b>. Eles afetam todas as páginas do app, não só esta.",
      side: "bottom",
      align: "start",
    },
    {
      title: "KPIs principais",
      description:
        "Os cartões logo abaixo mostram <b>vendas</b>, <b>receita</b>, <b>ticket médio</b> e <b>% com lead</b> (taxa de atribuição). A barra colorida no topo de cada cartão indica a categoria.",
    },
    {
      title: "Gráfico de evolução",
      description:
        "O gráfico mostra a evolução temporal por canal. Passe o mouse para ver detalhes do dia. Útil para identificar picos de campanha e sazonalidade.",
    },
    {
      element: "[data-tour='help-button']",
      title: "Ajuda sempre à mão",
      description:
        "Pode reabrir este tour a qualquer momento clicando neste botão. Cada página tem o seu próprio tutorial.",
      side: "left",
    },
  ],
};
