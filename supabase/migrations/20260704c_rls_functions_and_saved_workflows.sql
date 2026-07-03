-- activity_functions: public read (needed for onboarding Q2 + activity edit form),
-- superadmin-only write (matches how the client writes activity_categories directly
-- from the browser in FunctionsManageClient.tsx / ActivityEditClient.tsx).
ALTER TABLE activity_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_functions_select_all" ON activity_functions;
CREATE POLICY "activity_functions_select_all" ON activity_functions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "activity_functions_superadmin_write" ON activity_functions;
CREATE POLICY "activity_functions_superadmin_write" ON activity_functions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  );

-- user_saved_workflows: owner-scoped read/write/delete (matches user_progress).
-- Inserts happen server-side in app/api/onboarding/complete/route.ts using the
-- signed-in user's session, not a service role, so this must allow auth.uid() = user_id.
ALTER TABLE user_saved_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_saved_workflows_owner_select" ON user_saved_workflows;
CREATE POLICY "user_saved_workflows_owner_select" ON user_saved_workflows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_workflows_owner_insert" ON user_saved_workflows;
CREATE POLICY "user_saved_workflows_owner_insert" ON user_saved_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_workflows_owner_delete" ON user_saved_workflows;
CREATE POLICY "user_saved_workflows_owner_delete" ON user_saved_workflows
  FOR DELETE USING (auth.uid() = user_id);
