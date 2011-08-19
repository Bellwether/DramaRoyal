var gt = require('./../mechanics/game_tracker');

function doCallback(callback, data) {
  if (typeof callback === 'function') {
	callback(data);	
  }
}

function isAuthenticated(sessionId) {
  return sessionId !== undefined;	
}

var gameEvents = function(socket) {
  return {	
  }
}

function broadcastOnDisconnect(socket, gameEvents) {
  socket.on('disconnect', function () {
    removeGameEvents(gameEvents);
	var packet = {'message': 'girl left the game'};
	broadcastMessage(socket, packet);
  });
}

function broadcastOnChat(socket, userId) {
  socket.on('chat', function (msg, callback) {
	var packet = {'message': msg, 'player': {'_id': userId}};
	socket.broadcast.to(gameId).json.emit('chat', packet );
	doCallback(callback, true);
  });
}

function emitOnGameEvents(socket) {
  var ge = gameEvents(socket);
	
  gt.Main.on('gameStarted', ge.gameStarted);
  gt.Main.on('gameEnded', ge.gameEnded);
  gt.Main.on('turnStarted', ge.turnStarted);
  gt.Main.on('turnEnded', ge.turnEnded);
  gt.Main.on('playerQuit', ge.playerQuit);
  gt.Main.on('playerJoined', ge.playerJoined);
  gt.Main.on('playerReady', ge.playerReady);
  gt.Main.on('playerAction', ge.playerAction);

  return ge;
}

function removeGameEvents(gameEvents) {
  gt.Main.removeListener('gameCreated', gameEvents.gameCreated);
  gt.Main.removeListener('gameStarted', gameEvents.gameStarted);
  gt.Main.removeListener('turnCreated', gameEvents.turnCreated);
  gt.Main.removeListener('turnStarted', gameEvents.turnStarted);
  gt.Main.removeListener('gameEnded', gameEvents.gameEnded);
  gt.Main.removeListener('playerQuit', gameEvents.playerQuit);
  gt.Main.removeListener('playerJoined', gameEvents.playerJoined);
  gt.Main.removeListener('playerReady', gameEvents.playerReady);
  gt.Main.removeListener('playerAction', gameEvents.playerAction);
}

function initLobbySocket(socket, userId) {
  socket.emit('authorized', true);

  var joinPacket = {'message': 'girl entered the drama'};
  socket.broadcast.to(gameId).json.emit('announcement', joinPacket);

  broadcastOnChat(broadcastOnChat, userId);
  var gameEvents = emitOnGameEvents(socket)
  broadcastOnDisconnect(socket, gameEvents);
}

function joinGame(socket, userId, gameId) {
  socket.join(LOBBY_CHANNEL);

  socket.set('userId', userId, function (){
	socket.set('userName', 'girl'+(userId || '').substr(0,4), function (){ 
	  socket.set('gameId', gameId, function ()
  	    initLobbySocket(socket, userId);
      });	
	});
  });
}

var connectToGame = function (socket) {
  console.log("++ new socket connection");
	
  socket.once('authorizeUser', function (sessionId, gameId) {
	var userId;
	
    if (isAuthenticated(sessionId)) {
	  joinGame(socket, userId, gameId);
	} else {
      socket.disconnect();	
      return;
    }
  });
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToGame );
  }
}