import type { Tutorial } from "./types";
import { visaoGeralTutorial } from "./pages/visao-geral";
import { vendasTutorial } from "./pages/vendas";
import { turmasTutorial } from "./pages/turmas";
import { geografiaTutorial } from "./pages/geografia";
import { canaisTutorial } from "./pages/canais";
import { utmsTutorial } from "./pages/utms";
import { workspacesTutorial } from "./pages/workspaces";
import { modeloTutorial } from "./pages/modelo";
import { auditoriaTutorial } from "./pages/auditoria";
import { importTutorial } from "./pages/import";
import { cadastrosTutorial } from "./pages/cadastros";

export const TUTORIALS: Record<string, Tutorial> = {
  "visao-geral": visaoGeralTutorial,
  vendas: vendasTutorial,
  turmas: turmasTutorial,
  geografia: geografiaTutorial,
  canais: canaisTutorial,
  utms: utmsTutorial,
  workspaces: workspacesTutorial,
  modelo: modeloTutorial,
  auditoria: auditoriaTutorial,
  import: importTutorial,
  cadastros: cadastrosTutorial,
};

export const TUTORIAL_VERSION = "v1";
export const tutorialStorageKey = (key: string) => `tour:${TUTORIAL_VERSION}:${key}`;
