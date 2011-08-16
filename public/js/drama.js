var dramaUI = {
  domConnectionStatus: function(){ return $('#chat-status'); },
  domChatButton: function(){ return $('#game-console-submit'); },
  domChatBox: function(){ return $('#game-message'); },	

  printMessage: function(message, userId){
	var element = $('<p>'+message+'</p>');
    element.appendTo($('#player-chat-'+playerId));
  },
  enableChat: function() {
    dramaUI.domChatButton().removeAttr("disabled").removeClass('disabled');
  },
  disableChat: function() {
    dramaUI.domChatButton().attr('disabled', 'disabled').addClass('disabled');
  },
  disableGame: function() {
    $('.command').attr('disabled', 'disabled').addClass('disabled');
  },
  enableGame = function(){
    $('.command').removeAttr("disabled").removeClass('disabled');
  }
  setConnectionStatus: function (status){
    dramaUI.domConnectionStatus().text('Status: '+status);
  },
  initChatControls: function(socket) {
	var sckt = socket;
    var emitChatMessage = function(e){
      e.preventDefault();
      var data = dramaUI.domChatBox().val();
      sckt.emit('chat', data, function(){
        dramaUI.printMessage(data, socket.playerId);
      });
      dramaUI.domChatBox().val('');
      return false;
    };
    dramaUI.domChatButton().click(emitChatMessage);
  }
}

var Drama = function() {
  function getGameIdFromUrl() {
    var urlParts = window.location.toString().split('/'); 
    var gameId = urlParts[ urlParts.length-1 ].split('?')[0].replace('#','');
    return gameId;
  }	
  function isSecurePage() {
	return location.protocol.indexOf('https') === 0;
  };

  var TRANSPORTS = ['websocket','flashsocket','xhr-polling','jsonp-polling','htmlfile'];

  function onChat(data) { 
	dramaUI.printMessage(data.message, data.userId);
  };

  return {
    listen: function(userSessionId) {
	  if (userSessionId === undefined) return;
	
	  var options = {'transports': TRANSPORTS};
	  if (isSecurePage()) options['secure'] = true;
	  var socket = io.connect('/games', options);
	
	  function onAuthorized(data) {	
        if (data.authorized) {
		  // socket.on('player', onGamePlayerEvent);
		  // socket.on('game', onGameEvent);
		  socket.on('chat', onChat);

          dramaUI.setConnectionStatus('connected');	
          dramaUI.initChatControls(socket, data.userId);
          dramaUI.enableChat(socket);		
        } else {
	      window.top.location = "/games";
        }
      }
	
	  function onDisconnect() {
		dramaUI.disableGame();
		dramaUI.disableChat();
        dramaUI.setConnectionStatus('disconnected');
      }	

	  function onConnect() {
	    socket.on('disconnect', onDisconnect);
		socket.once('authorized', onAuthorized);
		
        socket.emit('authorizeUser', userSessionId);
	  }
	
	  function onConnectFailed() {	
        dramaUI.setConnectionStatus('cannot connect to game');
	  }
	  function onReconnecting(){
        dramaUI.setConnectionStatus('reconnecting to game');
	  };
	  function onReconnect(){
        dramaUI.setConnectionStatus('reconnected to game');
        dramaUI.enableChat();
	  };
	  function onReconnectFailure(){
        dramaUI.setConnectionStatus('failed to reconnect to game');
	  };	
	
	  socket.on('connect', onConnect);
	  socket.on('connect_failed', onConnectFailed);	
	  socket.on('reconnecting', onReconnecting);
	  socket.on('reconnect', onReconnect);
	  socket.on('reconnect_failure', onReconnectFailure);
	}
  };
}();

// Expose Drama to the global object
window.Drama = Drama;	