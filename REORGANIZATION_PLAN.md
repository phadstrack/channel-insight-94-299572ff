# Plano de Reorganização: Agrupar arquivos soltos

## ❌ Problema Atual

Arquivos configuração espalhados na raiz:
```
arc3-auditoria/
├── .env
├── .env.arc3.example
├── .git/
├── .gitignore
├── .prettierignore
├── .prettierrc
├── ARCHITECTURE.md
├── DECISIONS.md
├── DOCUMENT_AUDIT.md
├── README.md
├── SKILLS_INTEGRATION.md
├── components.json
├── eslint.config.js
├── package-lock.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
├── src/
├── supabase/
└── .git/
```

**Resultado:** 19 arquivos na raiz → difícil de navegar

---

## ✅ Solução: Agrupar em Pastas Lógicas

```
arc3-auditoria/
│
├── 📚 docs/                      (Documentação)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── SKILLS_INTEGRATION.md
│   └── DOCUMENT_AUDIT.md
│
├── ⚙️ config/                    (Configuração)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── .prettierignore
│   ├── components.json
│   └── wrangler.jsonc
│
├── 🔐 env/                       (Environment)
│   ├── .env                      (symlink para raiz ou git-ignored)
│   ├── .env.arc3.example
│   └── .env.example
│
├── 📦 package.json               (mantém na raiz - padrão Node)
├── 📦 package-lock.json          (mantém na raiz - padrão Node)
│
├── 🗄️ supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20260516000000_arc3_core_schema.sql
│
├── 💻 src/
│   ├── arc3/
│   ├── routes/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── integrations/
│   ├── styles.css
│   └── router.tsx
│
├── .git/                         (versionamento)
├── .gitignore                    (mantém na raiz - padrão Git)
│
└── DOCUMENT_AUDIT.md             (referência rápida do projeto)
```

---

## 📋 Mapeamento de Movimentação

| Arquivo Atual | Novo Local | Razão |
|---|---|---|
| `README.md` | `docs/README.md` | Documentação central |
| `ARCHITECTURE.md` | `docs/ARCHITECTURE.md` | Documentação técnica |
| `DECISIONS.md` | `docs/DECISIONS.md` | ADRs e decisões |
| `SKILLS_INTEGRATION.md` | `docs/SKILLS_INTEGRATION.md` | Metodologia |
| `DOCUMENT_AUDIT.md` | `docs/DOCUMENT_AUDIT.md` | Auditoria de arquivos |
| `vite.config.ts` | `config/vite.config.ts` | Build config |
| `tsconfig.json` | `config/tsconfig.json` | TS config |
| `eslint.config.js` | `config/eslint.config.js` | Linting config |
| `.prettierrc` | `config/.prettierrc` | Format config |
| `.prettierignore` | `config/.prettierignore` | Format exclusions |
| `components.json` | `config/components.json` | shadcn config |
| `wrangler.jsonc` | `config/wrangler.jsonc` | Cloudflare config |
| `.env` | `env/.env` | Secrets (ou symlink) |
| `.env.arc3.example` | `env/.env.arc3.example` | Template |
| `package.json` | **FICA NA RAIZ** | Padrão Node.js |
| `package-lock.json` | **FICA NA RAIZ** | Padrão Node.js |
| `.git/` | **FICA NA RAIZ** | Padrão Git |
| `.gitignore` | **FICA NA RAIZ** | Padrão Git |

---

## ⚠️ Arquivo Especial: .env

Opções:

### Opção A: Mover para env/
```bash
mkdir -p env
mv .env env/.env
echo "env/" >> .gitignore  # Já ignorado
```
**Pro:** Agrupado com .env.arc3.example  
**Con:** Breaking change se alguém espera .env na raiz

### Opção B: Symlink (recomendado)
```bash
mkdir -p env
mv .env env/.env
ln -s env/.env .env
```
**Pro:** Compatível com ferramentas que buscam .env na raiz  
**Con:** Requer Git LFS ou workaround

### Opção C: Configurar no package.json / vite.config.ts
```ts
// vite.config.ts
dotenv.config({ path: './env/.env' });
```
**Pro:** Nenhuma mágica, tudo explícito  
**Con:** Requer mudanças no código

---

## 🔍 Benefícios da Reorganização

| Benefício | Detalhe |
|-----------|---------|
| **Clareza** | Cada pasta tem um propósito: docs/, config/, env/, src/, supabase/ |
| **Onboarding** | Novo dev vê a estrutura e entende rápido onde está cada coisa |
| **Manutenção** | Mudança em config não afeta docs; mudança em docs não polui src/ |
| **CI/CD** | Pipelines podem focar em pastas: "se mudou em src/, rodar testes"; "se mudou em docs/, gerar site" |
| **Root limpa** | Raiz fica com apenas o essencial (package.json, .git, .gitignore, src/, supabase/) |

---

## 📊 Antes vs Depois

### Antes (19 arquivos na raiz)
```
arc3-auditoria/
├── .env
├── .env.arc3.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── ARCHITECTURE.md          ← Perdido no meio
├── DECISIONS.md            ← Perdido no meio
├── DOCUMENT_AUDIT.md       ← Perdido no meio
├── README.md
├── SKILLS_INTEGRATION.md    ← Perdido no meio
├── components.json
├── eslint.config.js        ← Config espalhada
├── package-lock.json
├── package.json
├── tsconfig.json           ← Config espalhada
├── vite.config.ts          ← Config espalhada
├── wrangler.jsonc          ← Config espalhada
├── src/
├── supabase/
└── .git/
```

### Depois (6 itens na raiz)
```
arc3-auditoria/
├── docs/                    ← Documentação agrupada
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── SKILLS_INTEGRATION.md
│   └── DOCUMENT_AUDIT.md
├── config/                  ← Configurações agrupadas
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── .prettierignore
│   ├── components.json
│   └── wrangler.jsonc
├── env/                     ← Environment agrupado
│   ├── .env
│   └── .env.arc3.example
├── src/                     ← Código (já organizado)
├── supabase/                ← Database (já organizado)
├── package.json             ← Essencial na raiz
├── package-lock.json        ← Essencial na raiz
├── .git/                    ← VCS (mantém)
├── .gitignore               ← VCS (mantém)
└── DOCUMENT_AUDIT.md        ← Referência rápida
```

**Resultado:** Raiz com apenas 6 pastas lógicas + 3 arquivos essenciais = **MUCHO melhor**

---

## 🚀 Próximas Passos

1. **Criar pastas:**
   ```bash
   mkdir -p docs config env
   ```

2. **Mover arquivos:** (seguindo mapeamento acima)

3. **Atualizar imports:**
   - `vite.config.ts` → `import from '../../config/...'`
   - `tsconfig.json` (não tem imports)
   - Documentação (links internos)

4. **Testar:**
   ```bash
   npm run build
   npm run lint
   npm run format
   ```

5. **Commit:**
   ```bash
   git add -A
   git commit -m "refactor: reorganize project structure into logical groups

   - Move docs/* (README, ARCHITECTURE, DECISIONS, SKILLS_INTEGRATION)
   - Move config/* (vite, tsconfig, eslint, prettier, wrangler, components)
   - Move env/* (.env files and templates)
   - Keep src/, supabase/, .git in root
   - Keep package.json, .gitignore in root (Node/Git standards)"
   ```

---

## ⚠️ Notas Importantes

- **Git paths:** Certificar que caminhos em .gitignore, scripts, etc. estão corretos
- **CI/CD:** Se usando GitHub Actions/etc, pode precisar atualizar paths
- **IDE:** A maioria das IDEs refaz imports automaticamente ao mover arquivos
- **node_modules:** Não será afetado (está em .gitignore)

---

## ✅ Checklist de Execução

- [ ] Criar pastas docs/, config/, env/
- [ ] Mover arquivos conforme mapeamento
- [ ] Verificar links em documentação (se houver)
- [ ] Testar build: `npm run build`
- [ ] Testar lint: `npm run lint`
- [ ] Testar format: `npm run format`
- [ ] Commit da reorganização
- [ ] Verificar se CI passa
