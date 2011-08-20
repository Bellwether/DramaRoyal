var lobbyUI = {
  domConnectionStatus: function(){ return $('#chat-status'); },
  domPlayerCount: function(){ return $('#player-count'); },
  domLobbyChat: function(){ return $('#lobby-chat'); },
  domChatButton: function(){ return $('#lobby-console-submit'); },
  domChatBox: function(){ return $('#lobby-message'); },

  setConnectionStatus: function (status){
    lobbyUI.domConnectionStatus().text('Status: '+status);
  },
  setplayerCount: function(cnt){
    lobbyUI.domPlayerCount().text('('+cnt+')');
  },
  printMessage: function(message, name){
    var element = name ? $('<p><b>'+name+':</b> '+message+'</p>') : $('<p>'+message+'</p>');
    element.appendTo(lobbyUI.domLobbyChat());
  },
  enableChat: function() {
    lobbyUI.domChatButton().removeAttr("disabled").removeClass('disabled');
  },
  disableChat: function() {
    lobbyUI.domChatButton().attr('disabled', 'disabled').addClass('disabled');
  },
  initChatControls: function(socket) {
	var sckt = socket;
    var emitChatMessage = function(e){
      e.preventDefault();
      var data = lobbyUI.domChatBox().val();
      if (!data || data.length === 0) return false;

      sckt.emit('chat', data, function() {
        lobbyUI.printMessage(data, 'me');
      });
      lobbyUI.domChatBox().val('');
      return false;
    };
    lobbyUI.domChatButton().click(emitChatMessage);
  }
}

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
  function onChat(data) { 
	lobbyUI.printMessage(data.message, data.name);
  };
  function onAnnouncement(data) {
	lobbyUI.printMessage(data.message);
	if (data.count) lobbyUI.setplayerCount(data.count);
  };

  function isSecurePage() {
	return location.protocol.indexOf('https') === 0;
  };

  return {
    listen: function(userSessionId) {
	  if (userSessionId === undefined) return;
	
	  var options = {'transports': TRANSPORTS};
	  if (isSecurePage()) options['secure'] = true;
	  var socket = io.connect('/lobby', options);
	
	  function onDisconnect() {
		lobbyUI.disableChat();
        lobbyUI.setConnectionStatus('disconnected');
      }
	
	  function onAuthorized(data) {	
        if (data.authorized) {
		  socket.on('player', onGamePlayerEvent);
		  socket.on('game', onGameEvent);
		  socket.on('chat', onChat);
		  socket.on('announcement', onAnnouncement);
		
		  if (data.count) lobbyUI.setplayerCount(data.count);

          lobbyUI.setConnectionStatus('connected');	
          lobbyUI.initChatControls(socket);
          lobbyUI.enableChat(socket);		
        }
      }
	
	  function onConnect() {
	    socket.on('disconnect', onDisconnect);
		socket.once('authorized', onAuthorized);
		
        socket.emit('authorizeUser', userSessionId);
	  }
	
	  function onConnectFailed() {	
        lobbyUI.setConnectionStatus('cannot connect to chat');
	  }
	  function onReconnecting(){
        lobbyUI.setConnectionStatus('reconnecting to chat');
	  };
	  function onReconnect(){
        lobbyUI.setConnectionStatus('reconnected to chat');
        lobbyUI.enableChat();
	  };
	  function onReconnectFailure(){
        lobbyUI.setConnectionStatus('failed to reconnect to chat');
	  };

	  socket.on('connect', onConnect);
	  socket.on('connect_failed', onConnectFailed);	
	  socket.on('reconnecting', onReconnecting);
	  socket.on('reconnect', onReconnect);
	  socket.on('reconnect_failure', onReconnectFailure);
    }
  };
}();

// Expose Lobby to the global object
window.Lobby = Lobby;