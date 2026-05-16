# Auditoria de Documentos & Configurações do ARC3

Data: 2026-05-16  
Objetivo: Revisar cada arquivo e decidir se faz sentido mantê-lo no projeto

---

## 📋 ANÁLISE DE CADA ARQUIVO

### DOCUMENTAÇÃO (4 arquivos)

| Documento | Finalidade | Alinhado? | Recomendação |
|-----------|-----------|-----------|--------------|
| **README.md** | Visão geral, sócios, fluxo, 10 skills | ✅ SIM | **MANTER** — Central para qualquer pessoa conhecer o projeto |
| **ARCHITECTURE.md** | Camadas técnicas, entidades, database schema | ✅ SIM | **MANTER** — Essencial para devs entender a arquitetura |
| **DECISIONS.md** | ADRs (11 decisões + ADR-012 dos 3 Ps) | ✅ SIM | **MANTER** — Documenta o "porquê" por trás das escolhas |
| **SKILLS_INTEGRATION.md** | 10 skills, workflow, fases de auditoria | ✅ SIM | **MANTER** — Explica a metodologia das 10 especialistas |

**Subtotal Docs:** 4/4 ✅ manter

---

### DEPENDÊNCIAS (4 arquivos)

| Arquivo | Propósito | Controle | Recomendação |
|---------|-----------|----------|--------------|
| **package.json** | Manifesto Node, scripts, deps (React, Router, Supabase, etc.) | Você | **MANTER** — Essencial para build/dev |
| **package-lock.json** | Lock de npm (363K) | Auto | **MANTER** — Reprodutibilidade npm |
| **bun.lockb** | Lock binário do Bun (295K) | Auto | **CONSIDERAR REMOVER** — Conflita com npm; escolha um |
| **bunfig.toml** | Config do Bun | Você | **REMOVER com bun.lockb** — Se usar npm, não precisa |

**Subtotal Deps:** Manter npm (package.json + package-lock.json), remover Bun

---

### BUILD & FRAMEWORK (4 arquivos)

| Arquivo | Propósito | Alinhado? | Recomendação |
|---------|-----------|-----------|--------------|
| **vite.config.ts** | Build Vite com TanStack Start, Tailwind, Cloudflare | ✅ SIM | **MANTER** — Essencial para dev/build |
| **tsconfig.json** | TypeScript strict, ES2022, path aliases | ✅ SIM | **MANTER** — Necessário para compilação |
| **wrangler.jsonc** | Cloudflare Workers config (deploy target) | ⚠️ TALVEZ | **REVISAR** — É realmente o target de deploy? Ou é local? |
| **components.json** | shadcn/ui setup (não ativo ainda) | ✅ SIM | **MANTER** — Pronto para quando adicionar shadcn componentes |

**Subtotal Build:** 3/4 manter, 1 revisar

---

### CODE QUALITY (3 arquivos)

| Arquivo | Propósito | Alinhado? | Recomendação |
|---------|-----------|-----------|--------------|
| **eslint.config.js** | ESLint: TS + React Hooks + Prettier | ✅ SIM | **MANTER** — Garante qualidade de código |
| **.prettierrc** | Prettier: format standard (100 cols, semicolons, etc.) | ✅ SIM | **MANTER** — Padroniza formatação |
| **.prettierignore** | Arquivos a não formatar | ✅ SIM | **MANTER** — Exclui generated files |

**Subtotal Quality:** 3/3 ✅ manter

---

### GIT & SOURCE CONTROL (2 arquivos)

| Arquivo | Propósito | Alinhado? | Recomendação |
|---------|-----------|-----------|--------------|
| **.gitignore** | Exclui node_modules, dist, .wrangler, etc. | ✅ SIM | **MANTER** — Standard git practice |
| **.git/** | Repository metadata | N/A | **MANTER** — Versioning |

**Subtotal Git:** 2/2 ✅ manter

---

### ENVIRONMENT (2 arquivos)

| Arquivo | Propósito | Alinhado? | Recomendação |
|---------|-----------|-----------|--------------|
| **.env** | API keys, credentials (Supabase, Claude, etc.) | ✅ SIM | **MANTER** — Necessário para dev local |
| **.env.arc3.example** | Template mostrando todas as vars necessárias | ✅ SIM | **MANTER** — Onboarding de novos devs |

**Subtotal Env:** 2/2 ✅ manter

---

### DATABASE & BACKEND (2 arquivos)

| Arquivo | Propósito | Alinhado? | Recomendação |
|---------|-----------|-----------|--------------|
| **supabase/config.toml** | Project ID do Supabase | ✅ SIM | **MANTER** — Identifica o banco |
| **supabase/migrations/20260516...sql** | Schema ARC3 (audits, findings, recommendations) | ✅ SIM | **MANTER** — Define banco de dados |

**Subtotal DB:** 2/2 ✅ manter

---

### ARQUIVO/BACKUP (1 arquivo)

| Arquivo | Propósito | Alinhado? | Recomendação |
|---------|-----------|-----------|--------------|
| **arc3auditoria.tar.gz** | Backup/snapshot do projeto | ❌ NÃO | **REMOVER** — Obsoleto, desnecessário com git |

**Subtotal Backup:** 0/1 remover

---

## 📊 RESUMO EXECUTIVO

### Contagem por Categoria

| Categoria | Total | Manter | Revisar | Remover |
|-----------|-------|--------|---------|---------|
| **Documentação** | 4 | 4 | 0 | 0 |
| **Dependências** | 4 | 2 | 0 | 2 |
| **Build/Framework** | 4 | 3 | 1 | 0 |
| **Code Quality** | 3 | 3 | 0 | 0 |
| **Git/Control** | 2 | 2 | 0 | 0 |
| **Ambiente** | 2 | 2 | 0 | 0 |
| **Database** | 2 | 2 | 0 | 0 |
| **Backup** | 1 | 0 | 0 | 1 |
| **TOTAL** | **22** | **18** | **1** | **3** |

**Percentual a manter: 82% (18/22)**

---

## ✅ ARQUIVOS A MANTER (18)

### Documentação (4)
- ✅ README.md
- ✅ ARCHITECTURE.md
- ✅ DECISIONS.md
- ✅ SKILLS_INTEGRATION.md

### Dependências (2)
- ✅ package.json
- ✅ package-lock.json

### Build & Framework (3)
- ✅ vite.config.ts
- ✅ tsconfig.json
- ✅ components.json

### Code Quality (3)
- ✅ eslint.config.js
- ✅ .prettierrc
- ✅ .prettierignore

### Git & Control (2)
- ✅ .gitignore
- ✅ .git/

### Environment (2)
- ✅ .env
- ✅ .env.arc3.example

### Database (2)
- ✅ supabase/config.toml
- ✅ supabase/migrations/20260516...sql

---

## ⚠️ ARQUIVOS A REVISAR (1)

### Build & Framework
- **wrangler.jsonc** — Cloudflare Workers config
  - **Questão:** É o deployment target oficial? Ou estamos usando Vercel/outro?
  - **Ação:** Confirmar estratégia de deploy antes de decidir

---

## ❌ ARQUIVOS A REMOVER (3)

### Dependências (2)
- ❌ **bun.lockb** — Conflita com npm/package-lock.json. Escolha um package manager.
- ❌ **bunfig.toml** — Dependência de bun.lockb

**Reason:** Manter npm + package-lock.json é mais universal. Bun é um package manager alternativo; se estão usando npm, esses são desnecessários.

### Backup (1)
- ❌ **arc3auditoria.tar.gz** — Snapshot de backup obsoleto
  
**Reason:** Git já controla o histórico. Arquivos .tar/.zip de backup ocupam espaço e criam confusão.

---

## 🎯 RECOMENDAÇÕES FINAIS

### Ação Imediata
```bash
# Remover arquivos desnecessários
rm arc3auditoria.tar.gz
rm bun.lockb
rm bunfig.toml
```

### Decisão Pendente
1. **Deploy strategy:** Confirmar se usará Cloudflare Workers (`wrangler.jsonc`) ou Vercel/outro
   - Se Cloudflare Workers → manter `wrangler.jsonc`
   - Se outro → remover `wrangler.jsonc`

### Verificação de Integridade
Após removê-los, rodar:
```bash
npm install          # Verifica se package.json está correto
npm run build        # Testa build
```

---

## 📝 CONCLUSÃO

**82% dos arquivos faz sentido manter.** O projeto está bem estruturado:
- ✅ Documentação clara e alinhada com visão ARC3
- ✅ Configuração de build moderna (Vite + TanStack)
- ✅ Qualidade de código garantida (ESLint + Prettier)
- ✅ Database schema adequado para audit framework
- ⚠️ Uma decisão pendente (deploy target)
- ❌ 3 arquivos claramente descartáveis (package manager duplication + backup)

Após remover os 3 e confirmar deploy strategy, o projeto estará **100% coeso e pronto para desenvolvimento.**
