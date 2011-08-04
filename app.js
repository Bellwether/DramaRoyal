(function() {
  var ex = require('express');
  var srv = require('./lib/server');

  var app = ex.createServer();
  srv.serveApp(app);
})();