var http = require('http');
var semver = require('semver');
var twilio = require('./lib/twilio');
var redis, timeout;

repos = ['iojs', 'node'];

paths = {
  node: 'http://semver.io/node.json',
  iojs: 'http://semver.io/iojs.json'
};

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

var query = function() {
  for (var i = 0; i < repos.length; i++) {
    repo = repos[i];
    path = paths[repo];
    (function(repo) {
      var req = http.request(path, function(res) {
        var body = '';
        res.on('data', function(d) {
          body += d;
        });
        res.on('end', function() {
          if(res.statusCode === 200) {
            try {
              var profile = JSON.parse(body);
              compare(repo, profile.all);
            } catch(error) {
              console.error(error);
            }
          } else {
            console.error({message: "Error"});
          }
        });
      });
      req.end();
    })(repo);
  }
};

// Takes the repo and an array of versions
var compare = function(repo, profile) {
  getFromRedis(repo).then(function(response) {
    var latestVersion = profile[profile.length - 1];
    if (response === null || semver.gt(latestVersion, response)) {
      update(repo, latestVersion);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(query, 5000);
    }
  });
};

var update = function(repo, value) {
  storeInRedis(repo, value).then(function(reply) {
    console.log("New version of "+ repo +" updated!");
    twilio(repo, value);
    clearTimeout(timeout);
    timeout = setTimeout(query, 5000);
  });
};

query();
