var dramaUI = {
  domConnectionStatus: function(){ return $('#chat-status'); },
  domChatButton: function(){ return $('#game-console-submit'); },
  domChatBox: function(){ return $('#game-message'); },	

  disableChat: function() {
    dramaUI.domChatButton().attr('disabled', 'disabled').addClass('disabled');
  },
  disableGame: function() {
    $('.command').attr('disabled', 'disabled').addClass('disabled');
  },
  setConnectionStatus: function (status){
    dramaUI.domConnectionStatus().text('Status: '+status);
  },
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

  return {
    listen: function(userSessionId) {
	  if (userSessionId === undefined) return;
	
	  var options = {'transports': TRANSPORTS};
	  if (isSecurePage()) options['secure'] = true;
	  var socket = io.connect('/games', options);	
	
	  function onDisconnect() {
		dramaUI.disableGame();
		dramaUI.disableChat();
        dramaUI.setConnectionStatus('disconnected');
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