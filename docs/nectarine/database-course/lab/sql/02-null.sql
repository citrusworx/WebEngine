-- Deliberately wrong: equality with NULL does not establish truth.
SELECT id FROM loans WHERE returned_at = NULL ORDER BY id;
-- Correct: which loans have no recorded return?
SELECT id FROM loans WHERE returned_at IS NULL ORDER BY id;
-- Fixed date makes the expected answer independent of today's date.
SELECT id FROM loans
WHERE returned_at IS NULL AND due_on < DATE '2026-09-15'
ORDER BY id;
