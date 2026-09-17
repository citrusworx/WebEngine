SELECT id, name FROM items ORDER BY category, id LIMIT 2 OFFSET 0;
SELECT id, name FROM items ORDER BY category, id LIMIT 2 OFFSET 2;
-- A keyset page after (category='audio', id=20).
SELECT id, name FROM items
WHERE (category, id) > ('audio', 20)
ORDER BY category, id LIMIT 2;
