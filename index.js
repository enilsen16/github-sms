var http = require('http'),
clc = require('cli-color'),
twilio = require('./lib/twilio'),
redis;

var port = process.env.PORT || 5000;

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  redis = require('redis').createClient();
}

redis.on('connect', function() {
  console.log('connected');
});

var storeInRedis = function(key, value) {
  return redis.set(key, value, function(err, reply) {
    console.log(reply);
  });
};

var getFromRedis = function(key, callback) {
  redis.get(key, function(err, reply) {
    callback(reply);
  });
};

setInterval(function() {
  var options = {
    hostname: '127.0.0.1',
    path: '/endpoint.json',
    method: 'GET',
    port: 8000,
  };

  var req = http.request(options, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      if(res.statusCode === 200) {
        try {
          var profile = JSON.parse(body);
          checkForNewVersion(profile.stable, profile.unstable);
        } catch(error) {
          console.error(error);
        }
      } else {
        console.error({message: "Error"});
      }
    });
  });
  req.end();

  req.on('error', function(e) {
    console.error(e);
  });
}, 5000);

function checkForNewVersion(stable, unstable) {
  console.log(stable, unstable);
  getFromRedis('iojs-stable', function(reply) {
    if (stable !== reply) {
      console.log(clc.greenBright("There is a new stable version of io.js!"));
      storeInRedis('iojs-stable', stable);
      twilio('stable', stable);
    }
  });
  getFromRedis('iojs-unstable', function(reply) {
    if (unstable !== reply) {
      console.log(clc.greenBright("There is a new unstable version of io.js!"));
      storeInRedis('iojs-unstable', unstable);
      twilio('unstable', unstable);
    }
  });
}
