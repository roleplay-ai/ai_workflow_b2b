-- Superadmin email management: one-time newsletters (selected news + workflows to
-- selected people) and recurring workflow-reminder schedules, both processed by a
-- daily Vercel cron. All writes go through service-role API routes, so RLS here is
-- service_role-only — no anon/authenticated access.

CREATE TABLE IF NOT EXISTS newsletters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  brief_id       uuid REFERENCES fluency_briefs(id) ON DELETE SET NULL,
  item_ids       uuid[] NOT NULL DEFAULT '{}',
  workflow_ids   uuid[] NOT NULL DEFAULT '{}',
  recipient_ids  uuid[] NOT NULL DEFAULT '{}',
  send_date      date NOT NULL,
  send_time      time NOT NULL,
  status         text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  sent_at        timestamptz,
  created_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_status_send_date ON newsletters(status, send_date);

CREATE TABLE IF NOT EXISTS workflow_reminder_schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  recipient_ids    uuid[] NOT NULL DEFAULT '{}',
  day_of_week      smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, matches JS Date#getDay
  send_time        time NOT NULL,
  start_date       date NOT NULL,
  duration_weeks   smallint NOT NULL CHECK (duration_weeks > 0),
  sends_completed  smallint NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  last_sent_date   date,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_reminder_schedules_status_day ON workflow_reminder_schedules(status, day_of_week);

CREATE TABLE IF NOT EXISTS email_sends (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type    text NOT NULL CHECK (source_type IN ('newsletter', 'workflow_reminder')),
  source_id      uuid NOT NULL,
  recipient_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email          text NOT NULL,
  status         text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message  text,
  workflow_ids   uuid[],
  sent_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_source ON email_sends(source_type, source_id);

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_newsletters" ON newsletters
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_workflow_reminder_schedules" ON workflow_reminder_schedules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_email_sends" ON email_sends
  FOR ALL TO service_role USING (true) WITH CHECK (true);
