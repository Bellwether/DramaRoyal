var mvc = require('./mvc');
var database = require('./database');
var assets = require('./assets');
var session = require('./session');
var sockets = require('./sockets');
var helpers = require('./helpers');
var auth = require('./authorization');

function getPort(app){
  var port = process.env.PORT
  app.configure('development', function () {
   port = port || 3000;
  });	

  app.configure('production', function () {
	port = port || 80;
  });
  return port;	
}

exports.serveApp = function (app) {
  database.init(app);
  session.init(app, database.config);
  assets.init(app);
  mvc.boot(app);
  helpers.init(app);
  auth.init(app);

  app.register('.html', require('ejs'));
  app.set('view engine', 'html');

  var io = sockets.listen(app);

  var port = getPort(app);
  app.listen(port, function () {
    console.log("Drama on port " + port);
  })

  sockets.listenToLobby(app, io);
  sockets.listenToGames(app, io);
  console.log("game and lobby sockets attached");
};
