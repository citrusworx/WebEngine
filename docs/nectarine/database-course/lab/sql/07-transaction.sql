BEGIN;
UPDATE loans SET returned_at = TIMESTAMPTZ '2026-09-15 12:00:00+00' WHERE id = 101;
INSERT INTO loans (id, member_id, item_id, due_on)
VALUES (105, 2, 10, DATE '2026-09-25');
-- Inside this transaction, the recorder is now lent to Mina.
SELECT id, member_id FROM loans WHERE item_id = 10 AND returned_at IS NULL;
ROLLBACK;
-- The original state is restored.
SELECT id, member_id FROM loans WHERE item_id = 10 AND returned_at IS NULL;
