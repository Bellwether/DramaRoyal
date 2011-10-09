var gameUI = {
  domGameList: function() { return $('#game-list'); },	
  domGameItem: function(gameId) { return $('#game-'+gameId) },
  domGameItemPlayerList: function(gameId) { return $('#game-'+gameId+'-players') },
  domPlayerItem: function(gameId, playerId) { return $('#game-'+gameId+'-player-'+playerId); },
  startGame: function(data) {
    var li = $('#game-'+data.game._id);
    li.children('.join').remove();
    li.addClass('active')
  },
  endGame: function(data) {
    gameUI.domGameItem(data.game._id).remove();
    lobbyUI.setGameCount(gameUI.domGameList().children('li').length);
  },
  newGame: function(data) {
    var players = data.game.players;
    var game = data.game;
    var gid = game._id;

    if ( gameUI.domGameItem(gid).html() !== null) return;

    function makeGameElement() { return $('<li id="game-'+gid+'" class="lobby-game"></li>'); } 
    function makeJoinLink() { return $('<a href="/games/'+gid+'" class="join button link">JOIN</a>'); }
    function makeTitle() { return $('<h5>'+game.title+' </h5>'); }
    function makeBody() { return $('<div class="body"></div>'); }
    function makePlayerList() {
	  var ul = $('<ul id="game-'+gid+'-players"></ul>');
	  for(var idx = 0; idx < players.length; idx++) {
	    var liId = 'game-'+gid+'-player-'+players[idx]._id;
	    var li = $('<li id="'+liId+'"></li>');
	    var nameLink = $("<a href='/profiles/"+players[idx]._id+"' class='popup'>"+players[idx].nick+"</a>");
	    nameLink.appendTo(li);
	    li.appendTo(ul);
	  };	
	  return ul;
    }

    var li = makeGameElement();
    var link = makeJoinLink();
    var title = makeTitle();
    var body = makeBody();
    var playerList = makePlayerList();
	
    link.appendTo(li);
    title.appendTo(li);
    playerList.appendTo(body);
    body.appendTo(li);
    li.appendTo(gameUI.domGameList());
    lobbyUI.setGameCount(gameUI.domGameList().children('li').length);
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
	  return $('<li id="'+'game-'+gid+'-player-'+pid+'"><a href="/profiles/'+pid+'" class="popup">'+nick+'</a></li>'); 
	} 
	
    var player = makePlayerElement();
    player.appendTo(gameUI.domGameItemPlayerList(gid));
  }
}

var lobbyUI = {
  domConnectionStatus: function(){ return $('#chat-status').children('span').first(); },
  domPlayerCount: function(){ return $('#player-count'); },
  domGameCount: function(){ return $('#game-count'); },
  domLobbyChat: function(){ return $('#lobby-chat'); },
  domChatButton: function(){ return $('#lobby-console-submit'); },
  domChatBox: function(){ return $('#lobby-message'); },
  domAudioControls: function(){ return $('#audio-controls'); },

  stripChatHTML: function(message) {
    return (message || '').replace(/<\/?[^>]+>/gi, '');
  },
  setConnectionStatus: function (status){
    lobbyUI.domConnectionStatus().text(status);
  },
  setplayerCount: function(cnt){
    lobbyUI.domPlayerCount().text('('+cnt+(cnt === 1 ? ' girl' : ' girls')+' present)');
  },
  setGameCount: function(cnt){
    lobbyUI.domGameCount().text('('+cnt+(cnt === 1 ? ' drama' : ' dramas')+' in progress)');
  },
  printMessage: function(message, name, userId){
	var msg = lobbyUI.stripChatHTML(message);
    var element = name ? $("<p><a class='popup' href='/profiles/"+userId+"'>"+name+'</a>: '+msg+'</p>') : $('<p>'+msg+'</p>');
    element.prependTo(lobbyUI.domLobbyChat());

    var wasJoiningMsg = message.indexOf('entered the homeroom') > 0;
    if (wasJoiningMsg) $.playSound({file: '/sfx/girl-enter'});
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
        lobbyUI.printMessage(lobbyUI.stripChatHTML(data), 'me', 'me');
      });
      lobbyUI.domChatBox().val('');
      return false;
    };
    lobbyUI.domChatButton().click(emitChatMessage);
  }
}

var Lobby = function() {
  var LOBBY_CHANNEL = 'lobby';
  var TRANSPORTS = ['flashsocket','xhr-polling','jsonp-polling','htmlfile'];

  function onGameEvent(data) { 
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
	lobbyUI.printMessage(data.message, data.name, data.userId);
  };
  function onAnnouncement(data) {
	lobbyUI.printMessage(data.message);
	if (data.count) lobbyUI.setplayerCount(data.count);
  };

  function isSecurePage() {
	return location.protocol.indexOf('https') === 0;
  };

  function addHistory(data) {
	var history = data.history;
	if (history.length < 1) return;
	
	for (var idx = 0; idx < history.length; idx++) {
	  var message = history[idx];
	  var nick = message.nick ? message.nick : '???';
	
	  var utc = Date.parse(message.ts);
	  utc = new Date(utc);
	  var offset = (new Date()).getTimezoneOffset();
	  utc.setHours(utc.getHours() + offset);
	  var hours = utc.getHours();
	  var minutes = utc.getMinutes() < 10 ? '0'+utc.getMinutes() : utc.getMinutes();
	
	  var ts = isNaN(hours) || isNaN(minutes) ? message.ts : (hours+":"+minutes);
	  var msg = message.msg+" @"+ts;
	  lobbyUI.printMessage(msg, nick, message.uid);
	}
	lobbyUI.printMessage("You can hear the giggling of girls...");
  }

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

          addHistory(data);

          lobbyUI.setConnectionStatus('connected');	
          lobbyUI.initChatControls(socket);
          lobbyUI.enableChat(socket);	
        }
      }
	
	  function onConnect() {
	    socket.on('disconnect', onDisconnect);
		socket.once('authorized', onAuthorized);
		
        socket.emit('authorizeUser', userSessionId);

        $.playSound({file: '/sfx/girl-enter'});
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