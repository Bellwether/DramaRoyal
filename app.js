(function() {
  var ex = require('express');
  var srv = require('./lib/server');
  var path = require('path');

  var app = ex.createServer();
  srv.serveApp(app);
})();