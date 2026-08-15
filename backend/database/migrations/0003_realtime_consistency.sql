ALTER TABLE users ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1);
-- statement-breakpoint
ALTER TABLE seller_applications ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1);
-- statement-breakpoint
CREATE TABLE realtime_recipient_sequences (
  user_id INTEGER PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
-- statement-breakpoint
CREATE TABLE realtime_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_user_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_version INTEGER NOT NULL CHECK (entity_version >= 1),
  created_at TEXT NOT NULL,
  UNIQUE (recipient_user_id, sequence),
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
-- statement-breakpoint
CREATE INDEX realtime_events_recipient_sequence_idx
  ON realtime_events(recipient_user_id, sequence);
-- statement-breakpoint
CREATE TABLE idempotency_records (
  actor_user_id INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL CHECK (status_code BETWEEN 200 AND 599),
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (actor_user_id, idempotency_key),
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
