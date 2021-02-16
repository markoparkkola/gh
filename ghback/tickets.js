//Load HTTP module
const { DH_CHECK_P_NOT_PRIME } = require("constants");
const http = require("http");
const hostname = '0.0.0.0';
const port = 3000;

let Datastore = require('nedb');

const databaseService = function() {
  const self = this;
  this.ticketDb = new Datastore({ filename: 'tickets.db', autoload: true });
  this.ticketDb.ensureIndex({ fieldName: 'ticket', unique: true });

  this.userDb = new Datastore({ filename: 'availabilities.db', autoload: true });
  this.userDb.ensureIndex({ fieldName: 'user', unique: true });
  
  this.assertNumber = function(value) {
    if (value == null || value == undefined || typeof value === 'number')
      return value;
    else
      return parseInt(value);
  };

  return {
    storeHours: function(repo, ticket, estimate, materialized, callback) {
      self.ticketDb.findOne({repo: repo, ticket: ticket}, function(err, doc) {
        estimate = self.assertNumber(estimate);
        materialized = self.assertNumber(materialized);
        if (doc)
          self.ticketDb.update({ repo: repo, ticket: ticket }, { $inc: { estimate: estimate, materialized: materialized }}, callback);
        else
          self.ticketDb.insert({ repo: repo, ticket: ticket, estimate: estimate, materialized: materialized }, callback);
      });
    },
    findHours: function(repo, tickets, callback) {
      if (typeof tickets === 'number')
        self.ticketDb.findOne({repo: repo, ticket: tickets}, callback);
      else
        self.ticketDb.find({repo: repo, ticket: { $in: tickets }}, callback);
    },
    storeAvailabilities: function(repo, milestone, user, availability, callback) {
      const query = { repo: repo, milestone: milestone, user: user };
      if (availability < 0)
        self.userDb.remove({ repo: repo, milestone: milestone, user: user }, callback);
      else
        self.userDb.findOne({ repo: repo, milestone: milestone, user: user }, function(err, doc) {
          availability = self.assertNumber(availability);
          if (doc)
            self.userDb.update({ repo: repo, milestone: milestone, user: user }, { $inc: { availability: availability }}, callback);
          else
            self.userDb.insert({ repo: repo, milestone: milestone, user: user, availability: availability }, callback);
        });
    },
    findAvailabilities: function(repo, milestone, users, callback) {
      if (!users || !users.length)
        callback(null, []);
      else
        self.userDb.find({repo: repo, milestone: milestone, user: { $in: users }}, callback);
    }
  };
};

const databaseServiceSingleton = new databaseService();

const controllers = {
  ticket: function(db) {
    this.db = db;

    return {
      hours: function(req, res, data) {
        this.db.findHours(data.repo, data.tickets, function(err, docs) {
          let result = {
            repo: data.repo,
            error: err,
            hours: docs ? docs.map(x => { return { id: x.ticket, estimate: x.estimate || 0, materialized: x.materialized || 0 }; }) : []
          };

          res.end(JSON.stringify(result));
        });
      },
      sethours: function(req, res, data) {
        this.db.storeHours(data.repo, data.ticket, data.estimate, data.materialized, function(err) {
          let result = {
            repo: data.repo,
            id: data.ticket,
            estimate: data.estimate,
            materialized: data.materialized,
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
        this.db.findAvailabilities(data.repo, data.milestone, data.users, function(err, docs) {
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
        if (data.availability == undefined)
          data.availability = -1;

        this.db.storeAvailabilities(data.repo, data.milestone, data.user, data.availability, function(err) {
          let result = {
            id: data.user,
            repo: data.repo,
            milestone: data.milestone,
            availability: data.availability < 0 ? null : data.availability,
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
        const issues = data.estimates.filter(x => x.ticket && x.estimate > 0).map(x => { return { repo: data.repo, ticket: x.ticket, estimate: x.estimate, materialized: 0 }; });
        issues.forEach(issue => {
          this.db.findHours(issue.repo, issue.ticket, function(err, doc) {
            if (err)
              console.log('BulkInsert - Error', err);
            else if (!doc) {
              this.db.storeHours(issue.repo, issue.ticket, issue.estimate, 0, function(err, doc) {

              });
            }
          });
        });
        res.end(null);
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

    const actionHandler = controller(databaseServiceSingleton)[request[1]];
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