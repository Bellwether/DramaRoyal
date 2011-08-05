var Lobby = function() {
  var LOBBY_CHANNEL = 'lobby';
  var TRANSPORTS = ['websocket','flashsocket','xhr-polling','jsonp-polling','htmlfile'];

  return {
    listen: function(userSessionId) {
	  var socket = io.connect('/lobby',	{'transports': TRANSPORTS});

	  socket.on('connect', function () {
        socket.emit('authorizeUser', userSessionId);
	  });

	  socket.on('connect_failed', function () {	
	  });	
    }
  };
}();