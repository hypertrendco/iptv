const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve('.gh-pages');
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + pathname);
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const stat = await fs.stat(filename);
    if (stat.isDirectory()) {
      const files = await fs.readdir(filename, {withFileTypes:true});
      const links = files.filter(f => !f.name.startsWith('.')).map(f => {
        const href = pathname.replace(/\/?$/, '/') + encodeURIComponent(f.name) + (f.isDirectory() ? '/' : '');
        return '<li><a href="' + escape(href) + '">' + escape(f.name) + (f.isDirectory() ? '/' : '') + '</a></li>';
      }).join('');
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>IPTV playlists</title></head><body><h1>IPTV playlists</h1><p>Open a playlist URL in VLC or another IPTV player.</p><ul>' + links + '</ul></body></html>');
    } else {
      const data = await fs.readFile(filename);
      res.writeHead(200, {'Content-Type':filename.endsWith('.m3u') ? 'application/vnd.apple.mpegurl; charset=utf-8' : 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300'});
      res.end(data);
    }
  } catch (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 400).end('Not found'); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('IPTV playlist server ready'));
