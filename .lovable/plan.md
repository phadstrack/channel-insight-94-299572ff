# Tutoriais por página (tour + botão de ajuda)

## Objetivo
Onboarding consistente em todas as páginas. No primeiro acesso de cada página, o usuário vê um **tour guiado** com tooltips destacando os elementos principais. Depois disso, um **botão de ajuda (?)** no header da página permite reabrir o tour a qualquer momento.

## UX

- **Botão de ajuda** no `PageHeader` (canto direito, ícone `HelpCircle`). Sempre visível.
- **Tour** abre automaticamente na primeira visita; usa overlay escurecido + spotlight no elemento + balão com título, descrição, contador (`2/5`) e botões `Anterior · Próximo · Pular`.
- **Persistência**: `localStorage` com chave `tour:v1:<pagina>` marcada após concluir/pular. Versão (`v1`) permite invalidar todos os tutoriais quando atualizarmos o conteúdo.
- Tour é "skippable" a qualquer passo. Ao clicar no `?`, sempre reabre do passo 1.

## Páginas cobertas (11)
Visão Geral, Vendas, Turmas, Geografia, Canais, Campanhas (UTMs), BI Workspaces, Modelo (legacy), Auditoria, Importar planilha, Cadastros.

> Cada tutorial terá entre **3 e 6 passos**, focando: o que a página mostra, como filtrar, como ler os números principais, e ações disponíveis.

## Implementação técnica

**Biblioteca**: `driver.js` (leve, sem dependências, suporta spotlight, dark overlay e tooltips customizadas via CSS). Alternativa considerada: `react-joyride` (mais pesada, depende de portal). Vamos com driver.js.

**Estrutura de arquivos**:
```
src/
  tutorials/
    index.ts              -> mapa { rota -> Tutorial }
    types.ts              -> type Tutorial = { steps: Step[] }
    pages/
      visao-geral.ts
      vendas.ts
      turmas.ts
      ...
  hooks/
    useTutorial.ts        -> hook que injeta driver, lê localStorage, expõe start()
  components/
    dashboard/
      HelpButton.tsx      -> botão (?) que chama useTutorial().start()
      PageHeader.tsx      -> recebe prop tutorialKey opcional, renderiza HelpButton
```

**Marcação dos elementos-alvo**: cada elemento do tour ganha um atributo `data-tour="kpi-receita"`, `data-tour="filtro-data"`, etc. Os steps referenciam esse seletor. Mantém JSX limpo (sem IDs).

**Hook `useTutorial(tutorialKey)`**:
- Lê tutorial de `tutorials/index.ts`
- Verifica `localStorage.getItem('tour:v1:' + key)` — se ausente, dispara auto-start no mount (com pequeno delay para garantir render)
- Expõe `start()` para o botão `?`
- `onDestroyed`/`onSkipped`: grava no localStorage

**Integração**: cada rota chama `useTutorial("visao-geral")` e passa `tutorialKey="visao-geral"` para o `PageHeader`. Sem mudanças nas queries/dados.

## Conteúdo dos tutoriais (resumo)

| Página | Foco do tour |
|---|---|
| Visão Geral | KPIs principais, filtros globais, gráfico de evolução |
| Vendas | Filtros, tabela, busca, tipos de atribuição |
| Turmas | Comparativo entre turmas, drilldown |
| Geografia | Mapa/tabela por estado e cidade |
| Canais | Breakdown por canal, leitura do gráfico |
| Campanhas (UTMs) | Hierarquia campanha→conteúdo→origem→mídia |
| BI Workspaces | Criar workspace, importar fonte, modelar relações, builder |
| Modelo (legacy) | Aviso de legado, queries SQL prontas |
| Auditoria | Findings de DQ, severidade, botão Reprocessar |
| Importar planilha | URL da planilha, GID, preview, importar leads/vendas |
| Cadastros | Abas (produtos/contas/edições/orçamentos/regras), CRUD |

## Estilização
- CSS do driver.js sobrescrito para casar com o design system: tooltip usa `bg-card`, `border-border`, `text-foreground`; botões usam classes do nosso `Button`.
- Spotlight com radius e glow combinando com `--primary`.

## Fora de escopo
- Tour multi-página (cada tour vive na sua rota).
- Persistência por `user_id` no banco (decisão: só localStorage por enquanto).
- Tradução (tudo em pt-BR).
- Tutoriais em rotas filhas de BI (`/app/w/:wid/sources`, `/app/w/:wid/model`) — vão herdar do tour de Workspaces, com 1-2 passos extras dentro dessas telas se necessário.

## Entregáveis
1. `bun add driver.js`
2. Hook `useTutorial` + componente `HelpButton` + atualização do `PageHeader`
3. 11 arquivos de tutorial em `src/tutorials/pages/`
4. Atributos `data-tour` adicionados nos elementos-alvo de cada página
5. CSS de override em `src/styles.css` (seção `.driver-popover` etc.)
