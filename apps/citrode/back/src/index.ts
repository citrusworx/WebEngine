import { Seltzer } from '@citrusworx/seltzer';
import { parser, PgSql } from '@citrusworx/nectarine';

const seltzer = new Seltzer();

seltzer.route({
    method: 'GET',
    path: '/hello',
    handler:  async (req: Record<string, unknown>, res: Record<string, any>) => {
    res.send('Hello, world!')}
});

seltzer.route({
    method: 'POST',
    path: '/sql',
    handler: async (req: Record<string, unknown>, res: Record<string, any>) => {
        const { query } = req.body as { query: string };
        
        try {
            const pgsql = new PgSql();
            const client = await pgsql.connect('mydb'); // Replace 'mydb' with your actual database name
            const result = await pgsql.query(client!, { sql: query });
            await pgsql.disconnect(client!);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Database query failed', details: error });
        }
    }
});


seltzer.listen(3000);