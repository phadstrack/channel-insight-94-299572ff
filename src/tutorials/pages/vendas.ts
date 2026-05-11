import type { Tutorial } from "../types";

export const vendasTutorial: Tutorial = {
  key: "vendas",
  steps: [
    {
      title: "Tabela de Vendas 🛒",
      description:
        "Aqui você vê <b>cada venda individual</b> com seu canal de atribuição, valor e leads associados. Use para investigar casos específicos.",
    },
    {
      element: "[data-tour='filters']",
      title: "Filtre antes de explorar",
      description:
        "Combine os filtros globais (data, turma, estado, canal) com a busca por nome/email para chegar rápido na venda que procura.",
      side: "bottom",
    },
    {
      title: "Tipos de atribuição",
      description:
        "Cada venda tem um <b>tipo de atribuição</b>: Lead Anterior (lead virou cliente), Lead Posterior (lead capturado depois da venda), UTM Direta ou Sem Atribuição. As cores ajudam a identificar.",
    },
    {
      title: "Toques do funil",
      description:
        "Ao expandir uma linha você vê todos os <b>toques</b> daquela pessoa antes da venda — campanha, conteúdo, dias até a compra. Essencial para entender a jornada.",
    },
  ],
};
