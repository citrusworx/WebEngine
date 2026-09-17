import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello, HTTP!" }));
});
server.listen(3000, () => console.log("Raw HTTP server: http://127.0.0.1:3000"));
