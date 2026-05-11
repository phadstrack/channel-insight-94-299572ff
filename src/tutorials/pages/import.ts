import type { Tutorial } from "../types";

export const importTutorial: Tutorial = {
  key: "import",
  steps: [
    {
      title: "Importar planilha 📤",
      description:
        "Aqui você atualiza os dados do app importando direto de uma planilha do Google Sheets — leads e vendas.",
    },
    {
      title: "1. URL da planilha",
      description:
        "Cole a <b>URL pública</b> da planilha (precisa estar com 'qualquer pessoa com o link pode ver'). É a mesma URL para leads e vendas.",
    },
    {
      title: "2. GIDs das abas",
      description:
        "Informe o <b>GID</b> (número da aba) para leads e para vendas. Pegue na URL ao clicar na aba: ...#gid=<b>123456</b>",
    },
    {
      title: "3. Preview antes de importar",
      description:
        "Use o botão <b>Preview</b> para ver as primeiras linhas e conferir se os cabeçalhos estão certos antes de subir os dados.",
    },
    {
      title: "4. Importe e reprocessa",
      description:
        "Depois de importar leads e vendas, vá em <b>Auditoria</b> e clique em Reprocessar — assim os dashboards refletem os novos dados.",
    },
  ],
};
