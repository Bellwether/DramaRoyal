var sio = require('socket.io');
var lc = require('./../sockets/lobby_comet');
var gc = require('./../sockets/game_comet');

exports.listen = function (app) {
  var io = sio.listen(app);	

  io.enable('browser client minification');
  io.configure('production', function () {
	io.enable('browser client etag');
	io.set('log level', 1);
  })

  return io;
};

exports.listenToLobby = function (app, io) {
  var lobby = io.of('/lobby');
  lc.listen(app, lobby);
}

exports.listenToGames = function (app, io) {
  var games = io.of('/games');
  gc.listen(app, games);
}