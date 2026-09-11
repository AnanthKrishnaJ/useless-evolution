const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/report-error' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('--- BROWSER ERROR REPORT ---');
      console.log(body);
      console.log('----------------------------');
      res.end('ok');
    });
  } else {
    res.end('ok');
  }
});
server.listen(3001, () => {
  console.log('Listening for error reports on 3001...');
});
