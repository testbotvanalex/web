const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3201;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Mirrors vercel.json rewrites for local preview
const REWRITES = [
  [/^\/css\/(.+)$/, '/public/css/$1'],
  [/^\/js\/(.+)$/, '/public/js/$1'],
  [/^\/assets\/(.+)$/, '/public/assets/$1'],
];

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Apply rewrites
  for (const [re, dest] of REWRITES) {
    if (re.test(urlPath)) {
      urlPath = urlPath.replace(re, dest);
      break;
    }
  }

  // Default to index.html
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('Preview server running at http://localhost:' + PORT);
});
