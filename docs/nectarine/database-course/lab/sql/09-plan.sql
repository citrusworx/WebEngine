-- Read the plan; do not demand that four rows justify an index scan.
EXPLAIN SELECT id FROM loans WHERE member_id = 1;
