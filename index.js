var https = require('https');
var twilio = require('./lib/twilio');
var _ = require('lodash');
var timeout, redis;

if (process.env.REDISTOGO_URL) {
  rtg = require('url').parse(process.env.REDISTOGO_URL);
  redis = require('redis').createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(':')[1]);
} else {
  redis = require('redis').createClient();
}

redis.on('connect', function() {
  return console.log('connected');
});

storeInRedis = function(key, value) {
  return new Promise(function(res, rej) {
    return redis.set(key, value, function(err, reply) {
      return res(reply);
    });
  });
};

getFromRedis = function(key) {
  return new Promise(function(res, rej) {
    return redis.get(key, function(err, reply) {
      return res(reply);
    });
  });
};

repos = ['joyent', 'iojs', 'atom', 'rails'];

paths = {
  joyent: 'node',
  iojs: 'io.js',
  atom: 'atom',
  rails: 'rails'
};

var query = function() {
  for (var i = 0; i < repos.length; i++) {
    repo = repos[i];
    path = paths[repo];

    var options = {
      hostname: 'api.github.com',
      method: 'GET',
      headers: {
        'user-agent': 'enilsen16',
        'Authorization': 'token ' + process.env.CLIENTID
      }
    };

    options.path = '/repos/' + repo + '/' + path + '/tags';
    (function(path) {
      var req = https.request(options, function(res) {
        var body = '';
        res.on('data', function(d) {
          body += d;
        });
        res.on('end', function() {
          if(res.statusCode === 200) {
            try {
              var profile = JSON.parse(body);
              var arr = [];
              for (var k = 0; k < profile.length; k++) {
                arr.push((profile[k].name));
              }
              compare(path, arr);
            } catch(error) {
              console.error(error);
            }
          } else {
            console.log(res.statusCode);
            console.error({message: "Error"});
          }
        });
      });
      req.end();
    })(path);
  }
};

// Takes the repo and an array of versions
var compare = function(repo, array) {
  getFromRedis(repo).then(function(response) {
    var newVersion = _.difference(array, JSON.parse(response));
    if (response === null) {
      update(repo, array);
    } else if (newVersion.length >= 1) {
      console.log("this is the new version:" + newVersion);
      update(repo, array);
      twilio(repo, newVersion);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(query, 10000);
    }
  });
};

var update = function(repo, value) {
  storeInRedis(repo, JSON.stringify(value)).then(function(reply) {
    console.log("New version of "+ repo +" updated!");
    clearTimeout(timeout);
    timeout = setTimeout(query, 10000);
  });
};

query();
