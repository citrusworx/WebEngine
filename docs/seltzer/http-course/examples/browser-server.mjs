import http from "node:http";

// A second origin for the CORS lesson, with no static-file dependency.
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8">
<title>Notes HTTP client</title><h1>Notes from another origin</h1>
<button id="read">Read notes</button><button id="create">Create note</button>
<pre id="result">Open the browser Network panel, then click a button.</pre>
<script>
async function request(init) {
  const output = document.querySelector('#result');
  try {
    const response = await fetch('http://127.0.0.1:3000/notes', init);
    output.textContent = response.status + '\\n' + await response.text();
  } catch (error) { output.textContent = String(error); }
}
document.querySelector('#read').onclick = () => request();
document.querySelector('#create').onclick = () => request({
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Created in a browser' })
});
</script></html>`);
}).listen(4000, "127.0.0.1", () => console.log("Browser lesson: http://127.0.0.1:4000"));
