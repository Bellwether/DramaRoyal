var gt = require('./../mechanics/game_tracker');
var LOBBY_CHANNEL = 'lobby';

function isAuthenticated() {
  return true;	
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
    if (!isAuthenticated()) {
      socket.disconnect();	
      return;
    }	

    socket.join(LOBBY_CHANNEL);
  });
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToLobby );
  }
}