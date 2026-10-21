const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = __dirname, port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg'};
http.createServer((req,res)=>{
 let pathname;
 try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400);return res.end('Bad request');}
 if(pathname!=='/' && pathname!=='/index.html' && !pathname.startsWith('/assets/')){res.writeHead(404);return res.end('Not found');}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data);});
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
