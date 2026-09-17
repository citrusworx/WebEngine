SELECT id, name FROM items WHERE details @> '{"portable":true}'::jsonb ORDER BY id;
SELECT id, details->>'inputs' AS input_text FROM items WHERE details ? 'inputs' ORDER BY id;
