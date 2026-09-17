SELECT m.id, m.name, COUNT(l.id) AS total_loans, COUNT(*) AS joined_rows
FROM members AS m
LEFT JOIN loans AS l ON l.member_id = m.id
GROUP BY m.id, m.name
ORDER BY m.id;
SELECT member_id, COUNT(*) AS total
FROM loans
GROUP BY member_id
HAVING COUNT(*) >= 2
ORDER BY member_id;
