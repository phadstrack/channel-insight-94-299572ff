# Resetar senha + tela "Minha conta"

## 1. Resetar senha via migration SQL

Migration que executa no banco Supabase:

```sql
UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'raphaelalmeida@febracis.com.br';
```

Após aplicar, login com:
- E-mail: `raphaelalmeida@febracis.com.br`
- Senha: `123456`

## 2. Nova rota `/conta` (Minha conta)

Página acessível pelo sidebar com:
- **Alterar senha**: campos "nova senha" + "confirmar", validação ≥ 6 caracteres, usa `supabase.auth.updateUser({ password })` no client (a sessão do próprio usuário autoriza).
- **Sair**: botão de logout.

## 3. Sidebar

Adicionar item "Minha conta" (ícone User) ao final da lista de navegação.

## Arquivos

- `supabase/migrations/<timestamp>_reset_admin_password.sql` (nova)
- `src/routes/conta.tsx` (nova)
- `src/components/dashboard/Sidebar.tsx` (adiciona link)

## Segurança

A senha `123456` é fraca — ao logar pela primeira vez, troque imediatamente em `/conta`. O Supabase exige ≥ 6 caracteres por padrão; a validação no client reforça isso.
