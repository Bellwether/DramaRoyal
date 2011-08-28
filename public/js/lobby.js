var gameUI = {
  domGameList: function() { return $('#game-list'); },	
  domGameItem: function(gameId) { return $('#game-'+gameId) },
  domPlayerItem: function(gameId, playerId) { return $('#game-'+gameId+'-player-'+playerId); },
  startGame: function(data) {
    var li = $('#game-'+data.game._id);
    var link = li.children('a').replaceWith(' (Fighting!)');
  },
  endGame: function(data) {
    gameUI.domGameItem(data.game._id).remove();
  },
  newGame: function(data) {
    var players = data.game.players;
    var game = data.game;
    var gid = game._id;

    if ( gameUI.domGameItem(gid).html() != null) return;

    function makeGameElement() { return $('<li id="game-'+gid+'" class="lobby-game"></li>'); } 
    function makeTitle() { return $('<h5>'+game.title+' </h5>'); }
    function makeJoinLink() { return $('<a href="/games/'+gid+'">[join drama]</a>'); }
    function makePlayerList() {
	  var ul = $('<ul></ul>');

	  for(var idx = 0; idx < players.length; idx++) {
	    var liId = 'game-'+gid+'-player-'+players[idx]._id;
	    $('<li id="'+liId+'">'+players[idx].nick+'</li>').appendTo(ul);
	  };	
	  return ul;
    }

    var li = makeGameElement();
    var title = makeTitle();
    var link = makeJoinLink();
    var playerList = makePlayerList();

    title.appendTo(li);
    playerList.appendTo(li);
    link.appendTo(li);
    li.appendTo(gameUI.domGameList());
  },
  playerLeft: function(data) {
	var gid = data.game._id;
	var pid = data.player._id;
    gameUI.domPlayerItem(gid, pid).remove();
  },
  playerJoined: function(data) {
	var gid = data.game._id
    var pid = data.player._id;
    var nick = data.player.nick;

    function makePlayerElement() { 
	  return $('<li id="'+'game-'+gid+'-player-'+pid+'">'+nick+'</li>'); 
	} 

    var players = gameUI.domGameItem(gid).children('ul').first();
    var player = makePlayerElement();
    player.appendTo(players);
  }
}

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
    element.prependTo(lobbyUI.domLobbyChat());
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
	console.log("onGameEvent: "+JSON.stringify(data));
	switch (data.event) {
	  case 'new':	
		gameUI.newGame(data);
	    break;
	  case 'started':
	    gameUI.startGame(data);
	    break;
	  case 'ended':
	    gameUI.endGame(data);
	    break;
	}
  }
  function onGamePlayerEvent(data) { 
	console.log("onGamePlayerEvent: "+JSON.stringify(data));
	switch (data.event) {
	  case 'joined':
	    gameUI.playerJoined(data);
	    break;			
	  case 'left':
	    gameUI.playerLeft(data);
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