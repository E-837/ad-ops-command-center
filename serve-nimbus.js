const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3003;
const server = http.createServer((req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'output', 'landing-nimbus-cloud-suite.html'));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
server.listen(PORT, () => console.log(`Nimbus landing page on http://localhost:${PORT}`));
setInterval(() => {}, 60000);
