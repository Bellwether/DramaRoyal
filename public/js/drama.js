var outcomeUI = {
  domPlayerPanel: function(){ return $('#game-players'); },
  domOutcomePanel: function(){ return $('#turn-outcomes'); },
  domOutcomeList: function(){ return outcomeUI.domOutcomePanel().children('ul').first(); },
  domOutcomePages: function() { return $('#outcome-pages'); },	
  domPlayerStatus: function(playerId) { return $('#player-status-'+playerId); },
  setPlayerStatus: function(status, playerId) {
	  outcomeUI.domPlayerStatus(playerId).html(status ? '('+ status+')' : '');
  },
  displayOutcomePage: function(outcome) {
    var li = $('<li><p>'+outcome.description+'</p></li>');
    li.appendTo(outcomeUI.domOutcomeList());
  },
  clearOutcomePages: function() {
	outcomeUI.domOutcomePages().css({ 'marginLeft': 0}).data('page', 0).empty();
  },
  applyDamage: function(outcome) {	
    var targets = outcome.targets;
	if (!targets) return;
	
    for(var idx = 0; idx < targets.length; idx++) {
      var userId = targets[idx].userId;
      var esteem = parseInt(outcome.esteem);
      if (esteem != 0) dramaUI.setPlayerEsteem(userId, esteem);
    }	
  },
  applyTattles: function(outcome) {
    var tattles = outcome.tattles;
	if (!tattles) return;
	
    for(var idx = 0; idx < tattles.length; idx++) {
      var playerItem = $('li#'+tattles[idx]);
      var ownPlayerExists = playerItem.data('self');
      if (ownPlayerExists) {
        dramaUI.useTattle( tattles[idx] );
        break;
      }
    }
  },
  applyMeds: function(outcome) {
    var meds = outcome.meds;
	if (!meds) return;
	
    for(var idx = 0; idx < meds.length; idx++) {
	  var playerItem = $('li#'+meds[idx]);
	  var ownPlayerExists = playerItem.data('self');
      if (ownPlayerExists){
	    dramaUI.useMed( outcome.meds[idx] );
	    break;
      }
    }	
  },
  applyHumiliation: function(outcome) {
    var humiliations = outcome.humiliations;
	if (!humiliations) return;

    for(var idx = 0; idx < humiliations.length; idx++) {
	  var targetId = humiliations[idx];
	  var playerElement = $('li#'+targetId);
	
	  playerElement.data('humilated', true);
	  outcomeUI.setPlayerStatus('humiliated', targetId);
	  dramaUI.disableTargetPlayer(targetId);
    }	
  },
  displayOutcome: function(data) {
	outcomeUI.clearOutcomePages();
	
	for(var key in data) {
	  var outcome = data[key];
	
      outcomeUI.displayOutcomePage(outcome);
      outcomeUI.applyDamage(outcome);
      outcomeUI.applyTattles(outcome);
      outcomeUI.applyMeds(outcome);
      outcomeUI.applyHumiliation(outcome);
    }
    dramaUI.hidePlayerPanel();
    dramaUI.showOutcomePanel();
  },
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
	    dramaUI.hideOutcomePanel()
	    dramaUI.showPlayerPanel();
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
  domReadyButton: function(){ return $('#player-ready'); },
  domTattleButton: function(){ return $('#player-tattle'); },	
  domMedButton: function(){ return $('#player-lick'); },
  domOutcomePanel: function(){ return $('#outcome-pages'); },	

  stripNonNumeric: function(text) {
    return (text || '').replace(/[^0-9]/g, ''); 
  },

  useTattle: function() {
    var tattles = dramaUI.domTattleButton().data('count');
    tattles = parseInt(tattles) - 1;
    dramaUI.domTattleButton().text('Tattle:'+tattles);
    dramaUI.domTattleButton().data('count', tattles);
  },
  useMed: function() {
    var meds = dramaUI.domMedButton().data('count');
    meds = parseInt(meds) - 1;
    dramaUI.domMedButton().text('Med:'+meds);
    dramaUI.domMedButton().data('count', meds);
  },
  printMessage: function(message, userId){
	var element = $('<p>'+message+'</p>');
    element.prependTo($('#player-chat-'+userId));
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
  disableTargetPlayer: function(targetId) {	
    $('#player-'+targetId+'-tease').remove();
    $('#player-'+targetId+'-scratch').remove();
    $('#player-'+targetId+'-grab').remove();
  },
  enableChat: function() {
    dramaUI.domChatButton().removeAttr("disabled").removeClass('disabled');
  },
  disableChat: function() {
    dramaUI.domChatButton().attr('disabled', 'disabled').addClass('disabled');
  },
  isChatDisabled: function() {
	dramaUI.domChatButton().attr('disabled') === undefined;
  },
  disableGame: function() {
    $('.command').attr('disabled', 'disabled').addClass('disabled');
  },
  enableGame: function() {
    $('.command').removeAttr("disabled").removeClass('disabled');
  },
  blurGame: function() {
    $('.command.selected').removeClass('selected');
  },
  removeGame: function() {
    $('.command').remove();
  },
  removePlayer: function(userId) {
	$('#player-list li').each(function(li) {
      var itemExists = $(this).attr('id') === userId.toString();
	  if (itemExists) {
        $(this).html('').attr('id', null);
        return false;
      }
	});	
  },
  readyToWaiting: function() {	
    dramaUI.domReadyButton().attr('disabled', 'disabled').unbind().text('waiting...');
  },
  removeReadyControl: function() {
	dramaUI.domReadyButton().remove();
  },
  hideOutcomePanel: function() {
    outcomeUI.domOutcomePanel().hide();
    dramaUI.domChatBox().focus();
  },
  showOutcomePanel: function() {
    outcomeUI.domOutcomePanel().show();
  },
  showPlayerPanel: function() {
    outcomeUI.domPlayerPanel().show();
  },
  hidePlayerPanel: function() {
    outcomeUI.domPlayerPanel().hide();
  },
  enableReadyButton: function() {
    dramaUI.domReadyButton().removeAttr("disabled");
  },
  setConnectionStatus: function (status) {
    dramaUI.domConnectionStatus().text('Status: '+status);
  },
  initChatControls: function(socket) {
	var sckt = socket;
    var emitChatMessage = function(e){
      e.preventDefault();
      if (dramaUI.isChatDisabled()) return false;

      var data = dramaUI.domChatBox().val();
      if (!data || data.length === 0) return false;

      sckt.emit('chat', data, function() {
        dramaUI.printMessage(data, socket.userId);
      });
      dramaUI.domChatBox().val('').focus();
      return false;
    };
    dramaUI.domChatButton().click(emitChatMessage);
  },
  initReadyControl: function(socket) {
	dramaUI.domReadyButton().click(function (e) {
      e.preventDefault();

      socket.emit('game', {command: 'ready'}, function(){
	    dramaUI.readyToWaiting();
      });
      return false;
    });
  },
  initGameControls: function(socket) {
    var gameAction = function(e){
      e.preventDefault();
      var btn = $(this);
      var cmd = btn.data('command');
      var userId = btn.parents('li').attr('id');
      var packet = {command: 'action', action: {command: cmd, targetId: userId }};
      console.log("sending game command: "+JSON.stringify(packet));

      socket.emit('game', packet, function(err, doc){
	    console.log("game command sent and acknowledged!!! "+err+" "+JSON.stringify(doc))
	    if (!err) {
	      $('.command.selected').removeClass('selected');
	      btn.addClass('selected');
	    };
	    dramaUI.domChatBox().focus();
      });

      return false;
    };
    $('.command').live('click', gameAction);	
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
  var ONE_SECOND = 1000;
  var TURN_DURATION = parseInt($('#game').attr('data-duration'));

  var gameAPI = {
    gameInterval: null,
    clearGameInterval: function() { 
	  if (gameAPI.gameInterval) {
		clearInterval(gameAPI.gameInterval);
	  }
	},
	setGameInterval: function(seconds, time) {
      gameAPI.gameInterval = setInterval(function() {
        var seconds = time % parseInt($('#game').attr('data-duration'));
        if (seconds < 10) seconds = "0" + seconds; 
        dramaUI.setClock(seconds);
        time--;

        if(time === 0) {
	      setTimeout(function() { dramaUI.setClock("00") }, ONE_SECOND);
          gameAPI.clearGameInterval();
          return;
        }
      }, ONE_SECOND);		
	},
    domGameStatus: function(){ return $('#outcome-pages'); },
    domPlayerStatus: function(playerId) { return $('#player-status-'+playerId); },
    isGameInProgress: function() {
      return gameAPI.domGameStatus().html().indexOf('Turn') >= 0;
    },
    isGameInCooldown: function() {
      return gameAPI.domGameStatus().html().indexOf('next turn') >= 0;
    },
    isPlayerReady: function(userId) {
	  return $('#player-status-'+userId).html().indexOf('active') > 0;
    },
    setPlayerStatus: function(status, playerId) {
	  gameAPI.domPlayerStatus(playerId).html(status ? '('+ status+')' : '');
    },

    startCountdown: function(seconds) {
      var time = seconds;
      dramaUI.setClock(time);	
      time--;
      gameAPI.setGameInterval(seconds, time);
    },
    turnStarted: function(data) {
      gameAPI.startCountdown(parseInt($('#game').attr('data-duration')));

      dramaUI.setTurn('Turn  ' + data.turn.cnt);
      dramaUI.enableGame();
      dramaUI.hideOutcomePanel()
      dramaUI.showPlayerPanel();
    },
    turnEnded: function(data) {	
      dramaUI.disableGame();
      gameAPI.clearGameInterval();
      outcomeUI.displayOutcome( data.turn.outcome );

      dramaUI.setTurn('Waiting for next turn'); 
      dramaUI.setClock('00');	
      dramaUI.blurGame();
    },
    playerReady: function(data) {
	  console.log("playerReady: "+JSON.stringify(data))
      var id = data.player._id;
      var status = data.player.status;
      gameAPI.setPlayerStatus('active', id);
    },
    gameStarted: function(data){
	  dramaUI.removeReadyControl();
	  gameAPI.turnStarted( {"turn":{"cnt":1}} );
    },
    gameEnded: function(data) {
	  dramaUI.removeGame();
      gameAPI.clearGameInterval();
      dramaUI.setTurn('Game Ended');
      dramaUI.setClock();

      var outcome = {'description': 'GAME OVER! '};
      if (data.winners) {
	    if (data.winners.length === 1) {
	      outcome.description =	outcome.description + data.winners[0].nick+" knew she was best as she watched other girls weep in defeat.";
	      gameAPI.setPlayerStatus('winner', data.winners[0]._id);
	    }
	    else {
	      for(var idx = 0; idx < data.winners.length; idx++) {
		    outcome.description = outcome.description + data.winners[idx].nick;
		    if (idx < data.winners.length - 1) outcome.description = outcome.description + ' and ';
		    gameAPI.setPlayerStatus('winner', data.winners[idx]._id);
	      }	
	      outcome.description = outcome.description + " laughed in victory while the others cried in shame.";
	    }
      } 
      else {
        outcome.description = "And oh what a mess! No girl was better than the others, each as worthless and ashamed as the next."	
      }
      outcomeUI.displayOutcomePage(outcome);
    },
    playerQuit: function(data) {
      var id = data.player._id;

      if ( gameAPI.isGameInProgress() ) {
        gameUI.setPlayerStatus('quit', id);
      } 
      else {
	    dramaUI.removePlayer(id);
      };
    },
    playerJoined: function(data){
      var name = data.player.nick;
      var id = data.player._id;	

      function makePlayerElement(li) { 
        li.attr('id', id);
	
	    var chatBubble = $("<p id='player-chat-"+id+"' class='chat-bubble'></p>");
	    var esteem = $("<div id='player-esteem-"+id+"' class='esteem'>Self Esteem: 10</div>");
	    var img = $("<img class='paperdoll' src='/img/placeholder.png' />");
	    var title = $("<span class='player-nick'>"+name+" <span id='player-status-"+id+"'>(pending)</span></span>");

	    var ctrlDiv = $("<div id='player-target-controls-"+id+"' class='player-controls'></div");
	    var tease = $("<button type='button' class='command' data-command='tease' disabled='disabled'>Tease</button>");
	    var scratch = $("<button type='button' class='command' data-command='scratch' disabled='disabled'>Scratch</button>");
	    var grab = $("<button type='button' class='command' data-command='grab' disabled='disabled'>Grab</button>");

	    chatBubble.appendTo(li);
	    esteem.appendTo(li);
	    img.appendTo(li);
	    title.appendTo(li);

	    tease.appendTo(ctrlDiv);
	    scratch.appendTo(ctrlDiv);
	    grab.appendTo(ctrlDiv);
	    ctrlDiv.appendTo(li);	
      }

      $('#player-list li').each(function(idx) {
	    var itemEmptyOrExists = $(this).html() === '' || $(this).attr('id') === id.toString();
        if (itemEmptyOrExists) {
	      var li = $(this);
          makePlayerElement(li);
          return false;
	    }
      });	
    }
  };

  function onChatEvent(data) { 
	var userId = (data.player || {})._id;
	dramaUI.printMessage(data.message, userId);
  };
  function onPlayerEvent(data) {
	console.log("player event!!!! "+JSON.stringify(data))
    switch (data.event) {
	    case 'joined':
	      gameAPI.playerJoined(data);
	      break;			
	    case 'quit':
	      gameAPI.playerQuit(data);
	      break;
	    case 'ready':
	      gameAPI.playerReady(data);
	      break;		
	  }
  };
  function onTurnEvent(data) {
	console.log("turn event!!!! "+JSON.stringify(data))
    switch (data.event) {
      case 'started':	
        gameAPI.turnStarted(data);
        break;			
      case 'ended':	
        gameAPI.turnEnded(data);
        break;	
    }
  };
  function onGameEvent(data) {
	console.log("game event!!!! "+JSON.stringify(data))
    switch (data.event) {
      case 'started':
        gameAPI.gameStarted(data);
        break;
      case 'ended':
        gameAPI.gameEnded(data);
        break;
    }
  };

  return {
    listen: function(userSessionId) {
	  if (userSessionId === undefined) return;
	
	  var options = {'transports': TRANSPORTS};
	  if (isSecurePage()) options['secure'] = true;
	  var socket = io.connect('/games', options);
	
	  function onAuthorized(data) {	
		console.log('onAuthorized '+JSON.stringify(data))
        if (data.authorized) {
	      function registerSocketEvents(sckt) {
		    sckt.on('player', onPlayerEvent);
		    sckt.on('game', onGameEvent);
		    sckt.on('turn', onTurnEvent);
		    sckt.on('chat', onChatEvent);
          }
          registerSocketEvents(socket);

          socket.userId = data.userId;

          dramaUI.setConnectionStatus('connected');	
          dramaUI.initChatControls(socket, data.userId);
          dramaUI.enableChat(socket);
          dramaUI.initGameControls(socket);
	
	      function registerReadyButton(sckt) {
            if (gameAPI.isPlayerReady(data.userId)) {
	          dramaUI.readyToWaiting();
	        } else {
              dramaUI.initReadyControl(sckt);
		      dramaUI.enableReadyButton();
            }
	      }
	      registerReadyButton(socket);

          function intiateCountdownIfInProgress() {
	        if (gameAPI.isGameInProgress() && !gameAPI.isGameInCooldown()) {
              var seconds = $.stripNonNumeric( $('#turn-timer').html() );
	          if (seconds.length > 0) gameAPI.startCountdown( parseInt(seconds) );
              dramaUI.enableGame();
            } else {
              dramaUI.disableGame();
	        }
	      }
	      intiateCountdownIfInProgress();
 
          outcomeUI.init(dramaUI.domOutcomePanel());
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
		
        socket.emit('authorizeUser', userSessionId, getGameIdFromUrl());
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