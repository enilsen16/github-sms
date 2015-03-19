var express = require('express');
var index = require('./index.js');
var app = express();

app.get('/', function (req, res) {
  console.log("Yay dummy site!");
  res.send('Hello World');
});

app.listen(process.env.PORT || 5000);
