-- Clientes (workspaces)
CREATE TABLE arc3_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text,
  logo_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Membros de cliente (usuários com acesso a um cliente)
CREATE TABLE arc3_client_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES arc3_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'viewer', 'editor')) DEFAULT 'viewer',
  invited_at timestamptz DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Adicionar client_id à tabela arc3_audits
ALTER TABLE arc3_audits
  ADD COLUMN client_id uuid REFERENCES arc3_clients(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX idx_arc3_clients_created_by ON arc3_clients(created_by);
CREATE INDEX idx_arc3_client_members_client_id ON arc3_client_members(client_id);
CREATE INDEX idx_arc3_client_members_user_id ON arc3_client_members(user_id);
CREATE INDEX idx_arc3_audits_client_id ON arc3_audits(client_id);

-- Enable RLS
ALTER TABLE arc3_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE arc3_client_members ENABLE ROW LEVEL SECURITY;
