var Lobby = function() {
  var LOBBY_CHANNEL = 'lobby';
  var TRANSPORTS = ['websocket','flashsocket','xhr-polling','jsonp-polling','htmlfile'];

  function onGameEvent(data) {	
	switch (data.event) {
	  case 'new':
	    break;
	  case 'started':
	    break;
	  case 'ended':
	    break;
	}
  }

  function onGamePlayerEvent(data) {	
	switch (data.event) {
	  case 'joined':
	    break;			
	  case 'left':
	    break;
	}
  }

  return {
    listen: function(userSessionId) {
	  if (userSessionId === undefined) return;
	
	  var socket = io.connect('/lobby',	{'transports': TRANSPORTS});
	
	  function onDisconnect() {
      }
	
	  function onAuthorized(data) {	
        if (!data.authorized)	{
		  socket.on('player', onGamePlayerEvent);
		  socket.on('game', onGameEvent);
        }
      }
	
	  function onConnect() {
	    socket.on('disconnect', onDisconnect);
		socket.once('authorized', onAuthorized);
		
        socket.emit('authorizeUser', userSessionId);		
	  }
	
	  function onConnectFailed() {	
	  }
	  function onReconnecting(){
	  };
	  function onReconnect(){
	  };
	  function onReconnectFailure(){
	  };

	  socket.on('connect', onConnect);
	  socket.on('connect_failed', onConnectFailed);	
	  socket.on('reconnecting', onReconnecting);
	  socket.on('reconnect', onReconnect);
	  socket.on('reconnect_failure', onReconnectFailure);
    }
  };
}();