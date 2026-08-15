CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'normal' CHECK (role IN ('normal', 'seller', 'administrator')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'disabled')),
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
-- statement-breakpoint
CREATE INDEX users_role_idx ON users(role);
-- statement-breakpoint
CREATE INDEX users_account_status_idx ON users(account_status);
-- statement-breakpoint
CREATE TABLE auth_action_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
-- statement-breakpoint
CREATE INDEX auth_action_tokens_user_purpose_idx ON auth_action_tokens(user_id, purpose);
-- statement-breakpoint
CREATE INDEX auth_action_tokens_expiry_idx ON auth_action_tokens(expires_at);
