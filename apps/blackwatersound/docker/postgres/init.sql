-- Out-of-band Docker first-boot only — not app backend code.
-- Compiled from productSchema.yml + waitlistSchema.yml via Nectarine compileSchemas.
-- App migrate() runs the same compiler over all Blackwater *Schema.yml (additive).
-- Mixed-case catalog columns are quoted so Postgres does not fold them.
-- CREATE TABLE IF NOT EXISTS does not ALTER existing volumes; migrate() ADD COLUMN does.
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  catalog TEXT CHECK (catalog IN ('gear', 'software')),
  name TEXT,
  slug TEXT UNIQUE,
  sub TEXT,
  price TEXT,
  "originalPrice" TEXT,
  img TEXT,
  accent TEXT,
  badge TEXT,
  category TEXT CHECK (category IN ('Guitars', 'Cabs', 'Pedals', 'Effects', 'Amplifiers', 'Studio', 'Lifestyle', 'Accessories', 'DAW', 'Plugins', 'Software')),
  tags JSON,
  blurb TEXT,
  "isNew" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  source_app TEXT CHECK (source_app IN ('www', 'gear', 'software', 'courses', 'studio', 'songwriting', 'blog')),
  interest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);
