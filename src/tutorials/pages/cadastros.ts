import type { Tutorial } from "../types";

export const cadastrosTutorial: Tutorial = {
  key: "cadastros",
  steps: [
    {
      title: "Cadastros administrativos ⚙️",
      description:
        "Gerencie aqui as entidades de configuração do app: produtos, contas, edições, orçamentos e regras de classificação.",
    },
    {
      title: "Abas",
      description:
        "Cada aba é uma tabela diferente. <b>Produtos</b> são os cursos/programas; <b>Edições</b> são as turmas-mãe; <b>Orçamentos</b> são metas mensais; <b>Regras</b> classificam vendas em produtos automaticamente.",
    },
    {
      title: "CRUD básico",
      description:
        "Em cada aba, use <b>Novo</b> para criar, o ícone de lápis para editar e a lixeira para remover. Campos com * são obrigatórios.",
    },
    {
      title: "Cuidado ao remover",
      description:
        "Remover um produto ou edição pode quebrar referências em orçamentos e regras. Edite com cuidado e reprocessa o pipeline em <b>Auditoria</b> depois de mudanças.",
    },
  ],
};
