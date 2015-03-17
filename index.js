var https = require('https'),
    redis = require('redis'),
    twilio = require('./lib/twilio'),
    client = redis.createClient();

client.on('connect', function() {
  console.log('connected');
});

var storeInRedis = function(key, value) {
  return client.set(key, value, function(err, reply) {
    console.log(reply);
  });
};

var getFromRedis = function(key, callback) {
  client.get(key, function(err, reply) {
    callback(reply);
  });
};

setInterval(function() {
  var options = {
    hostname: 'semver.io',
    path: '/iojs.json',
    method: 'GET',
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      if(res.statusCode === 200) {
        try {
          var profile = JSON.parse(body);
          console.log("The current stable version of io.js is " + profile.stable +
            "\n" + "The current unstable version of io.js is " + profile.unstable);
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
  getFromRedis('iojs-stable', function(reply) {
    if (stable !== reply) {
      console.log("There is a new stable version of io.js!");
      storeInRedis('iojs-stable', stable);
      twilio('stable', stable);
    }
  });
  getFromRedis('iojs-unstable', function(reply) {
    if (unstable !== reply) {
      console.log("There is a new unstable version of io.js!");
      storeInRedis('iojs-unstable', unstable);
      twilio('unstable', unstable);
    }
  });
}
