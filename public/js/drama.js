var outcomeUI = {
  init: function(list){	
    var isAnimating = false;
    var next = $('#' + list.data('next') );
    var previous = $('#' + list.data('previous') );

    function movePage(position, sign) {
      var width = list.children('li').first().width();

      isAnimating = true;
      list.animate({ 'marginLeft': width * position }, 600, function() {
        isAnimating = false;
      });
    }

    function changePosition(delta) {
      var currentPage = list.data('page');
      currentPage = currentPage + delta;
	
      movePage(currentPage, delta);
      list.data('page', currentPage);
    }
	
    function paginate(delta) {
	  if (isAnimating) return false;
      var currentPage = list.data('page');
      var numberOfPages = list.children('li').length;
      var pageDelta = currentPage+delta;
	
      if (pageDelta > 0) return false;
      if (pageDelta <= -numberOfPages) {
	    var outcomePanel = $('#turn-outcomes');
	    outcomePanel.hide();
	    $('#game-players').show();
	    return false;
      }
	
      changePosition(delta);
      return false;
    }	
	
    next.click(function() { paginate(-1); });
    previous.click(function() { paginate(1); });
  }	
};

var dramaUI = {
  domConnectionStatus: function(){ return $('#chat-status'); },
  domChatButton: function(){ return $('#game-console-submit'); },
  domChatBox: function(){ return $('#game-message'); },	
  domTattleButton: function(){ return $('#player-tattle'); },	
  domLickButton: function(){ return $('#player-lick'); },	
  stripNonNumeric: function(text) {
    return text.replace(/[^0-9]/g, ''); 
  },

  useTattle: function() {
    var tattles = dramaUI.domTattleButton().data('count');
    tattles = parseInt(tattles) - 1;
    dramaUI.domTattleButton().text('Tattle('+tattles+')');
    dramaUI.domTattleButton().data('count', tattles);
  },
  useLick: function() {
    var licks = dramaUI.domLickButton().data('count');
    licks = parseInt(licks) - 1;
    dramaUI.domLickButton().text('Lick('+licks+')');
    dramaUI.domLickButton().data('count', licks);
  },
  printMessage: function(message, userId){
	var element = $('<p>'+message+'</p>');
    element.appendTo($('#player-chat-'+userId));
  },
  setClock: function(time) {
    $('#turn-timer').html( time ? (time + ' seconds') : '' );
  },
  setTurn: function(turn) {
    $('#game-status').html( turn );
  },
  setPlayerEsteem: function(userId, delta) {
    var esteemBox = $('#player-esteem-'+userId);
    var esteem = dramaUI.stripNonNumeric( esteemBox.html() );
    esteem = Math.max( parseInt(esteem) + parseInt(delta), 0 );
    esteemBox.html('Self Esteem: '+esteem);
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
  enableGame: function() {
    $('.command').removeAttr("disabled").removeClass('disabled');
  }
  setConnectionStatus: function (status) {
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