var https = require('https');

var options = {
  hostname: 'api.github.com',
  path: '/repos/rails/rails/tags',
  method: 'GET',
  headers: {
    'user-agent': 'enilsen16'
  }
};

var req = https.request(options, function(res) {
  console.log("statusCode: ", res.statusCode);
  console.log("headers: ", res.headers);

  res.on('data', function(d) {
    process.stdout.write(d);
  });
});
req.end();

req.on('error', function(e) {
  console.error(e);
});
