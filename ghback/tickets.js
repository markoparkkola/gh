//Load HTTP module
const http = require("http");
const hostname = '127.0.0.1';
const port = 3000;



const controllers = {
  ticket: function() {
    return {
      estimates: function(req, res, data) {
        const ticketIds = JSON.parse(data.tickets);
        return {
          repo: data.repo,
          estimates: ticketIds.map(x => {return { id: x, estimate: 1.00 }; })
        };
      },
      estimate: function(req, res, data) {
        return {
          repo: data.repo,
          id: data.ticket,
          estimate: data.estimate,
        };
      }
    };
  },
  user: function() {
    return {
      availabilities: function(req, res, data) {
        const userIds = JSON.parse(data.users);
        return userIds.map(x => {return { id: x, availability: 37.5 };});
      },
      availability: function(req, res, data) {
        return {
          id: data.user,
          availability: data.availability
        };
      }
    };
  }
};

//Create HTTP server and listen on port 3000 for requests
const server = http.createServer((req, res) => {

  console.log('Request', req.method, req.url);
  //Object.keys(req.headers).forEach(x => console.log(x, req.headers[x]));

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

    const actionHandler = controller()[request[1]];
    if (!actionHandler) {
      console.log('Action not found.');
      res.statusCode = 400;
      res.end('No such action.');
      return;
    }

    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('application/json'))
      data = JSON.parse(data);

    const response = actionHandler(req, res, data);
    res.end(JSON.stringify(response));
  });
});

//listen for request on port 3000, and as a callback function have the port listened on logged
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});