BEGIN;
INSERT INTO items (id, name, category, details)
VALUES (50, 'Headphones', 'audio', '{}') RETURNING id, name;
UPDATE items SET name = 'Studio headphones' WHERE id = 50 RETURNING id, name;
DELETE FROM items WHERE id = 50 RETURNING id;
ROLLBACK;
SELECT COUNT(*) AS total_items FROM items;
