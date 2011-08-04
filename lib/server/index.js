var mvc = require('./mvc');
var database = require('./database');
var assets = require('./assets');
var sockets = require('./sockets');

exports.serveApp = function (app) {
  database.init(app);
  assets.init(app);
  mvc.boot(app);

  app.register('.html', require('ejs'));
  app.set('view engine', 'html');

  var io = sockets.listen(app);

  var port = process.env.PORT || 3000;
  app.listen(port, function () {
    console.log("Drama on " + port);
  })

  sockets.listenToLobby(app, io);
  sockets.listenToGames(app, io);
};
