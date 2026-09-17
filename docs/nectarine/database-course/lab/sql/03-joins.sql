SELECT l.id, m.name AS borrower, i.name AS item
FROM loans AS l
JOIN members AS m ON m.id = l.member_id
JOIN items AS i ON i.id = l.item_id
WHERE l.returned_at IS NULL
ORDER BY l.id;
-- Keep all members, even when no open loan matches.
SELECT m.id, m.name, l.id AS loan_id
FROM members AS m
LEFT JOIN loans AS l ON l.member_id = m.id AND l.returned_at IS NULL
ORDER BY m.id, l.id;
