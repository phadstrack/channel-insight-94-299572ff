import type { Tutorial } from "../types";

export const auditoriaTutorial: Tutorial = {
  key: "auditoria",
  steps: [
    {
      title: "Auditoria de Dados 🛡️",
      description:
        "Aqui o sistema lista <b>problemas detectados</b> nos dados: emails inválidos, duplicidades, valores zerados, datas suspeitas.",
    },
    {
      title: "Severidades",
      description:
        "Cada finding tem uma severidade: <b>error</b> (precisa correção), <b>warn</b> (revisar), <b>info</b> (apenas informativo).",
    },
    {
      title: "Reprocessar pipeline",
      description:
        "Após corrigir dados na origem (planilhas), use o botão <b>Reprocessar</b> para reconstruir o core analítico (dim_pessoa, fct_venda, fct_lead, bridges) e atualizar os findings.",
    },
    {
      title: "Resolver finding",
      description:
        "Quando já resolvido, marque o finding como <i>resolvido</i> com uma nota — fica registrado no histórico de auditoria.",
    },
  ],
};
