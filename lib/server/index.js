var express = require('express');
var mvc = require('./mvc');
var database = require('./database');
var assets = require('./assets');
var session = require('./session');
var sockets = require('./sockets');
var helpers = require('./helpers');
var auth = require('./authorization');
var fba = require('./../facebook/authentication');

function getPort(app){
  return port = process.env.PORT || 3000;
}

function useLogger(app){
  app.use( express.logger(':method :url :status') );
}

function useBody(app){
  app.use( express.bodyParser() );
  app.use( express.methodOverride() );	
}

exports.serveApp = function (app) {
  database.init(app);
  session.init(app, database.config);
  assets.init(app);
  useLogger(app);
  useBody(app);
  auth.init(app);
  fba.init(app);
  mvc.boot(app);
  helpers.init(app);

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
