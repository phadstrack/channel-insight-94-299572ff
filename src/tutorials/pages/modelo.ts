import type { Tutorial } from "../types";

export const modeloTutorial: Tutorial = {
  key: "modelo",
  steps: [
    {
      title: "Modelo (legacy) 🗄️",
      description:
        "Esta tela é a versão antiga de exploração de dados — útil para queries SQL diretas e ver o esquema das tabelas.",
    },
    {
      title: "Use o BI Workspaces no lugar",
      description:
        "Para análises novas, prefira a nova área <b>BI Workspaces</b> (no menu Admin). É mais flexível e está em desenvolvimento ativo.",
    },
    {
      title: "Queries prontas",
      description:
        "A tela traz exemplos de SQL prontos para copiar. Útil se você precisa de uma análise pontual e sabe SQL.",
    },
  ],
};
