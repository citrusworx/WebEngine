import http from 'node:http';
export const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
        data: "Hello, world!",
    }));
});
//# sourceMappingURL=server.js.map