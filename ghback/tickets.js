//Load HTTP module
const http = require("http");
const hostname = '127.0.0.1';
const port = 3000;

let Datastore = require('nedb');
let database = new Datastore({ filename: 'tickets.db', autoload: true });

const controllers = {
  ticket: function(db) {
    this.db = db;

    return {
      estimates: function(req, res, data) {
        this.db.find({ repo: data.repo, ticket: { $in: data.tickets } }, function(err, docs) {
          let result = {
            repo: data.repo
          };

          if (err)
            result.error = err;
          else {
            result.estimates = docs ? docs.map(x => { return { id: x.ticket, estimate: x.estimate }; }) : [];
          }

          res.end(JSON.stringify(result));
        });
      },
      estimate: function(req, res, data) {
        this.db.update({ repo: data.repo, ticket: data.ticket }, { repo: data.repo, ticket: data.ticket, estimate: data.estimate }, { upsert: true }, function(err) {
          let result = {
            repo: data.repo,
            id: data.ticket,
            estimate: data.estimate,
            error: err
          };

          res.end(JSON.stringify(result));
        });
      }
    };
  },
  user: function(db) {
    this.db = db;

    return {
      availabilities: function(req, res, data) {
        this.db.find({ repo: data.repo, milestone: data.milestone, user: { $in: data.users } }, function(err, docs) {
          let result = {
            availabilities: docs ? docs.map(x => { return { id: x.user, availability: x.availability }; }) : [],
            repo: data.repo, 
            milestone: data.milestone,
            error: err
          };

          res.end(JSON.stringify(result));
        });
      },
      availability: function(req, res, data) {
        if (data.availability < 0)
          this.db.remove({ repo: data.repo, milestone: data.milestone, user: data.user }, function(err) {
            let result = {
              id: data.user,
              repo: data.repo,
              milestone: data.milestone,
              availability: null,
              error: err
            };

            res.end(JSON.stringify(result));
          });
        else
          this.db.update({ repo: data.repo, milestone: data.milestone, user: data.user}, { repo: data.repo, milestone: data.milestone, user: data.user, availability: data.availability }, { upsert: true }, function(err) {
            let result = {
              id: data.user,
              repo: data.repo,
              milestone: data.milestone,
              availability: data.availability,
              error: err
            };

            res.end(JSON.stringify(result));
          });
      }
    };
  },
  data: function(db) {
    this.db = db;

    return {
      bulkInsert: function(req, res, data) {
        this.db.insert(data.estimates.map(x => { return { repo: data.repo, ticket: x.id, estimate: x.estimate }; }), function(err, docs) {
          let result = {
            inserted: docs.length,
            error: err
          };
          res.end(JSON.stringify(result));
        });
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