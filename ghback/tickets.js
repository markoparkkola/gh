//Load HTTP module
const { DH_CHECK_P_NOT_PRIME } = require("constants");
const http = require("http");
const hostname = '0.0.0.0';
const port = 3000;

const database = require('./dbapi').databaseService();
const controllers = require('./controllers').controllers;

//Create HTTP server and listen on port 3000 for requests
const server = http.createServer((req, res) => {
  console.log('Request', req.method, req.url);

  if (req.method === 'OPTIONS') {
    const corsMethod = req.headers['access-control-request-method'];
    const corsHeaders = req.headers['access-control-request-headers'];

    if (corsMethod && corsHeaders) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', corsHeaders);
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    else
      res.setHeader('Allow', 'OPTIONS, GET, POST');

    res.end();
    return;
  }

  let data = '';
  req.on('data', chunk => {
    data += chunk;
  })
    .on('end', () => {
      //Set the response HTTP header with HTTP status and Content type
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const request = req.url.substring(1).split('/');
      console.log('Request', request);

      const controller = controllers[request[0]];
      if (!controller) {
        console.log('Controller not found.');
        res.statusCode = 400;
        res.end('No such controller.');
        return;
      }

      const actionHandler = controller(database)[request[1]];
      if (!actionHandler) {
        console.log('Action not found.');
        res.statusCode = 400;
        res.end('No such action.');
        return;
      }

      const contentType = req.headers['content-type'];
      if (contentType && contentType.includes('application/json'))
        data = JSON.parse(data);

      actionHandler(req, res, data);
    });
});

//listen for request on port 3000, and as a callback function have the port listened on logged
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});