const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = path.join(__dirname, 'public', req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'text/plain' });
    res.end(data);
  });
});
server.listen(4123, () => console.log('serving on 4123'));
