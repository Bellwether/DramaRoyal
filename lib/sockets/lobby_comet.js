var gt = require('./../mechanics/game_tracker');
var usr = require('./../../models/user').Model;
var LOBBY_CHANNEL = 'lobby';

function openConnectionCount(socket) {
  return Object.keys(socket.manager.open).length;	
}

function isAuthenticated() {
  return true;	
}

function broadcastOnChat(socket) {
  socket.on('chat', function (msg, callback) {
	var packet = {'message': msg};
	broadcastMessage(socket, packet, 'chat');
    if (typeof callback === 'function') callback(true);
  });
}

function broadcastOnDisconnect(socket) {
  socket.on('disconnect', function () {
	var packet = {'message': 'girl left the homeroom', 'count': openConnectionCount(socket)};
	broadcastMessage(socket, packet);
  });	
}

function emitAuthorized(socket, packet) {
  socket.emit('authorized', packet);	
}

function broadcastMessage(socket, packet, kind) {
  kind = kind || 'announcement';
  socket.broadcast.to(LOBBY_CHANNEL).json.emit(kind, packet );
}

function initLobbySocket(socket){
  var connectionCount = openConnectionCount(socket);
  
  var authPacket = {'authorized': true, 'count': connectionCount};
  emitAuthorized(socket, authPacket);

  var joinPacket = {'message': 'girl entered the homeroom', 'count': connectionCount};
  broadcastMessage(socket, joinPacket);

  broadcastOnChat(socket);
  broadcastOnDisconnect(socket);
}

function joinLobby(socket, userId) {
  socket.join(LOBBY_CHANNEL);
  socket.set('userId', userId, function (){ 
	initLobbySocket(socket) 
  });	
}

var connectToLobby = function (socket) {
  console.log("++ new socket connection");
	
  function emitGameEvent(evnt, data, type) {
    type = type || 'game';
    data = data || {};
    data.event = evnt;
    socket.json.emit('game', data );
  }
	
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