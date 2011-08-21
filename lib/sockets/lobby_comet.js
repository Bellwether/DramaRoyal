var gt = require('./../mechanics/game_tracker');
var usr = require('./../../models/user').Model;
var LOBBY_CHANNEL = 'lobby';

function doCallback(callback, data) {
  if (typeof callback === 'function') {
	callback(data);	
  }
}

var gameEvents = function(socket) {
  function emitGameEvent(evnt, data, type) {
    type = type || 'game';
    data = data || {};
    data.event = evnt;
    socket.json.emit('game', data );
  }

  return {	
    gameCreated: function (game){
      var pid = game.players[0]._id;
      var players = [{ "_id": pid, "name": pid}];
      var packet = {'game': { "_id": game._id, "players": players, "title": game.title}};
      emitGameEvent('new', packet);
    },
    gameStarted: function (game){
     var packet = {"game": {"_id": game._id}};
     emitGameEvent('started', packet);
    },
    gameEnded: function (game, outcome){
      var packet = {"game": {"_id": game._id}};
      emitGameEvent('ended', packet);
    },
    playerJoined: function (playerId, gameId){
      var packet = {"player": {"_id": playerId}, "game": {"_id": gameId} };
      emitGameEvent('joined', packet, 'player');
    },
    playerQuit: function(playerId, gameId) {
      var packet = {"player": {"_id": playerId}, "game": {"_id": gameId} };
      emitGameEvent('left', packet, 'player');
    }
  }
}

function openConnectionCount(socket) {
  return socket.manager.namespaces['/'+LOBBY_CHANNEL].clients().length;	
}

function isAuthenticated() {
  return true;	
}

function broadcastOnChat(socket) {
  socket.on('chat', function (msg, callback) {
	var packet = {'message': msg};
	broadcastMessage(socket, packet, 'chat');
	doCallback(callback, true);
  });
}

function broadcastOnDisconnect(socket, gameEvents) {
  socket.on('disconnect', function () {
    removeGameEvents(gameEvents);
	var packet = {'message': 'girl left the homeroom', 'count': openConnectionCount(socket)};
	broadcastMessage(socket, packet);
  });	
}

function emitOnGameEvents(socket) {
  var ge = gameEvents(socket);
	
  gt.Main.on('gameCreated', ge.gameCreated);
  gt.Main.on('gameStarted', ge.gameStarted);
  gt.Main.on('gameEnded', ge.gameEnded);
  gt.Main.on('playerQuit', ge.playerQuit);
  gt.Main.on('playerJoined', ge.playerJoined);

  return ge;
}

function removeGameEvents(gameEvents) {
  gt.Main.removeListener('gameCreated', gameEvents.gameCreated);
  gt.Main.removeListener('gameStarted', gameEvents.gameStarted);
  gt.Main.removeListener('gameEnded', gameEvents.gameEnded);
  gt.Main.removeListener('playerQuit', gameEvents.playerQuit);
  gt.Main.removeListener('playerJoined', gameEvents.playerJoined);
}

function emitAuthorized(socket, packet) {
  socket.emit('authorized', packet);	
}

function broadcastMessage(socket, packet, kind) {
  kind = kind || 'announcement';
  socket.broadcast.to(LOBBY_CHANNEL).json.emit(kind, packet );
}

function initLobbySocket(socket) {
  var connectionCount = openConnectionCount(socket);
  
  var authPacket = {'authorized': true, 'count': connectionCount};
  emitAuthorized(socket, authPacket);

  var joinPacket = {'message': 'girl entered the homeroom', 'count': connectionCount};
  broadcastMessage(socket, joinPacket);

  broadcastOnChat(socket);
  var gameEvents = emitOnGameEvents(socket);
  broadcastOnDisconnect(socket, gameEvents);
}

function joinLobby(socket, userId) {
  socket.join(LOBBY_CHANNEL);
  socket.set('userId', userId, function (){
	socket.set('userName', 'girl'+(userId || '').substr(0,4), function (){ 
	  initLobbySocket(socket) 
	});
  });	
}

var connectToLobby = function (socket) {
  console.log("++ new socket connection");
	
  socket.once('authorizeUser', function (sessionId) {
	var userId;
	
    if (isAuthenticated()) {
	  joinLobby(socket, userId);
	} else {
      socket.disconnect();	
      return;
    }
  });
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToLobby );
  }
}