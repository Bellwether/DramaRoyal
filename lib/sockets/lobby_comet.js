var gt = require('./../mechanics/game_tracker');
var usr = require('./../../models/user').Model;
var LOBBY_CHANNEL = 'lobby';
var util = require('util')

function doCallback(callback, data) {
  if (typeof callback === 'function') {
	callback(data);	
  }
}

function consoleLogSocket(socket) {
  console.log("")	
  console.log("SOCKET INFO:")	
  console.log("socketid = "+socket.id);
  console.log("rooms: ");
  console.log(util.inspect(socket.manager.rooms));
  console.log("lobby clients: ");
  console.log("open: "+util.inspect(socket.manager.open));
  console.log("closed: "+util.inspect(socket.manager.closed));
  console.log("connected: "+util.inspect(socket.manager.connected));
}

var gameEvents = function(socket) {
  function emitGameEvent(evnt, data, type) {
    type = type || 'game';
    data = data || {};
    data.event = evnt;
    socket.json.emit(type, data);
	console.log("emitGameEvent ("+evnt+", "+type+"): "+JSON.stringify(data));
	consoleLogSocket(socket)
  }

  return {	
    gameCreated: function (game){
      var pid = game.players[0]._id;
      var nick = game.players[0].nick;
      var players = [{ "_id": pid, "nick": nick}];
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

function authenticateUserSession(sessionId, callback) {
  usr.findBySessionId(sessionId, callback);
}

function broadcastOnChat(socket, nick) {
	console.log("++++++LISTENING TO CHAT NOW")
  socket.on('chat', function (msg, callback) {
	console.log("broadcastOnChat socketid = "+socket.id);
	var packet = {'message': msg, 'name': nick};
	broadcastMessage(socket, packet, 'chat');
	doCallback(callback, true);
  });
}

function broadcastOnDisconnect(socket, nick, gameEvents) {
  socket.on('disconnect', function () {
    removeGameEvents(gameEvents);
	var packet = {'message': nick+' left the homeroom', 'count': openConnectionCount(socket)};
	broadcastMessage(socket, packet);
	consoleLogSocket(socket)
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
  socket.broadcast.to(LOBBY_CHANNEL).json.emit(kind, packet);
}

function initLobbySocket(socket, nick) {
  var connectionCount = openConnectionCount(socket);
  
  var authPacket = {'authorized': true, 'count': connectionCount};
  emitAuthorized(socket, authPacket);

  var joinPacket = {'message': nick+' entered the homeroom', 'count': connectionCount};
  broadcastMessage(socket, joinPacket);

  broadcastOnChat(socket, nick);
  var gameEvents = emitOnGameEvents(socket);
  broadcastOnDisconnect(socket, nick, gameEvents);
  consoleLogSocket(socket)
}

function joinLobby(socket, userId, nick) {
  socket.join(LOBBY_CHANNEL);
  socket.set('userId', userId, function (){
	socket.set('userName', nick, function (){ 
	  initLobbySocket(socket, nick) ;
	});
  });	
}

var connectToLobby = function (socket) {
  socket.once('authorizeUser', function (sessionId) {
	authenticateUserSession(sessionId, function(err, doc) {
      if (doc) {
	    joinLobby(socket, doc._id, doc.avatar.nick);
      } else {	
	    socket.emit('authorized', false);
        socket.disconnect();
      }		
    });
  });
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToLobby );
  }
}