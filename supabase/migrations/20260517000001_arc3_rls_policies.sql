-- Helper function: check if user is admin
-- For now, admins are those created_by the original owner
-- Later: add is_admin column to auth.users metadata
CREATE OR REPLACE FUNCTION is_arc3_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- TODO: implement proper admin check (e.g., custom claim in JWT)
  -- For MVP: anyone who created a client or has a super-user flag
  RETURN EXISTS(
    SELECT 1 FROM arc3_clients WHERE created_by = user_id LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- arc3_clients policies
CREATE POLICY "clients_admin_all" ON arc3_clients
  FOR SELECT USING (is_arc3_admin(auth.uid()));

CREATE POLICY "clients_member_own" ON arc3_clients
  FOR SELECT USING (
    id IN (
      SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
    )
  );

-- arc3_client_members policies
CREATE POLICY "members_admin_all" ON arc3_client_members
  FOR SELECT USING (is_arc3_admin(auth.uid()));

CREATE POLICY "members_self_read" ON arc3_client_members
  FOR SELECT USING (user_id = auth.uid());

-- arc3_audits policies
CREATE POLICY "audits_admin_all" ON arc3_audits
  FOR SELECT USING (is_arc3_admin(auth.uid()));

CREATE POLICY "audits_member_own_client" ON arc3_audits
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
    )
  );

-- arc3_data_sources policies (filtered by audit → client)
CREATE POLICY "data_sources_admin_all" ON arc3_data_sources
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "data_sources_member_own_audit" ON arc3_data_sources
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );

-- arc3_normalized_data policies
CREATE POLICY "norm_data_admin_all" ON arc3_normalized_data
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "norm_data_member_own_audit" ON arc3_normalized_data
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );

-- arc3_findings policies
CREATE POLICY "findings_admin_all" ON arc3_findings
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "findings_member_own_audit" ON arc3_findings
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );

-- arc3_recommendations policies
CREATE POLICY "recs_admin_all" ON arc3_recommendations
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "recs_member_own_audit" ON arc3_recommendations
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );

-- arc3_metrics policies
CREATE POLICY "metrics_admin_all" ON arc3_metrics
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "metrics_member_own_audit" ON arc3_metrics
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );

-- arc3_tracking_issues policies
CREATE POLICY "tracking_admin_all" ON arc3_tracking_issues
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "tracking_member_own_audit" ON arc3_tracking_issues
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );

-- arc3_audit_executions policies
CREATE POLICY "executions_admin_all" ON arc3_audit_executions
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits WHERE is_arc3_admin(auth.uid())
    )
  );

CREATE POLICY "executions_member_own_audit" ON arc3_audit_executions
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM arc3_audits
      WHERE client_id IN (
        SELECT client_id FROM arc3_client_members WHERE user_id = auth.uid()
      )
    )
  );
