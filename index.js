var https = require('https');
var redis = require('redis');
var client = redis.createClient();

client.on('connect', function() {
    console.log('connected');
});

var storeInRedis = function(key, value) {
  return client.set(key, value, function(err, reply) {
    console.log(reply);
  });
};

var getFromRedis = function(key) {
  return client.get(key, function(err, reply) {
    console.log(reply);
  });
};

var options = {
  hostname: 'api.github.com',
  path: '/repos/iojs/io.js/tags',
  method: 'GET',
  headers: {
    'user-agent': 'enilsen16'
  }
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
        console.log(profile[0].commit.sha);
        storeInRedis('io.js', profile[0].commit.sha);
        console.log(getFromRedis('io.js'));
      } catch(error) {
        printError(error);
      }
    } else {
      printError({message: "Error"});
    }
  });
});
req.end();

req.on('error', function(e) {
  console.error(e);
});
