-- Fixed teaching data; each lab run creates a new in-memory database.
INSERT INTO members (id, name, email) VALUES
  (1, 'Ada', 'ada@example.test'),
  (2, 'Mina', 'mina@example.test'),
  (3, 'Sol', 'sol@example.test');
INSERT INTO items (id, name, category, details) VALUES
  (10, 'Recorder', 'audio', '{"portable":true,"inputs":2}'),
  (20, 'Mixer', 'audio', '{"portable":false,"inputs":8}'),
  (30, 'Camera', 'video', '{"portable":true,"resolution":"4k"}'),
  (40, 'Tripod', 'support', '{}');
INSERT INTO loans (id, member_id, item_id, due_on, returned_at) VALUES
  (101, 1, 10, DATE '2026-09-10', NULL),
  (102, 2, 20, DATE '2026-09-12', TIMESTAMPTZ '2026-09-12 10:00:00+00'),
  (103, 1, 30, DATE '2026-09-20', NULL),
  (104, 2, 10, DATE '2026-09-01', TIMESTAMPTZ '2026-09-01 09:00:00+00');
