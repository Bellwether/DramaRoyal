var avatarUI = {
  defeatedStance: "/img/avatars/defeatedstance.png",
  createPaperdoll: function(id, stance) {
    var dollDiv = $("<div class='doll'></div>")
    var dollArmsImg;
    var dollImg;

    if (stance === 'defeated') {
      var dollImg = $("<img id='paperdoll-"+id+"' class='paperdoll' src='/img/avatars/defeatedstance.png' />");
    } else if (stance === 'scratch') {
      var dollArmsImg = $("<img id='paperdoll-"+id+"-arms' class='paperdoll-arms' src='/img/avatars/scratcharms.png'>");
      var dollImg = $("<img id='paperdoll-"+id+"' class='paperdoll' src='/img/avatars/normalstance.png' />");
    } else if (stance === 'grab') {
      var dollArmsImg = $("<img id='paperdoll-"+id+"-arms' class='paperdoll-arms' src='/img/avatars/grabbingarms.png'>");
      var dollImg = $("<img id='paperdoll-"+id+"' class='paperdoll' src='/img/avatars/normalstance.png' />");
    } else if (stance === 'tease' || stance === 'tattle') {
      var dollArmsImg = $("<img id='paperdoll-"+id+"-arms' class='paperdoll-arms' src='/img/avatars/tellingarms.png'>");
      var dollImg = $("<img id='paperdoll-"+id+"' class='paperdoll' src='/img/avatars/normalstance.png' />");
    } else {
      var dollArmsImg = $("<img id='paperdoll-"+id+"-arms' class='paperdoll-arms' src='/img/avatars/basicarms.png'>");
      var dollImg = $("<img id='paperdoll-"+id+"' class='paperdoll' src='/img/avatars/normalstance.png' />");
    }

    if (dollArmsImg) dollArmsImg.appendTo(dollDiv);
    if (dollImg) dollImg.appendTo(dollDiv);
    return dollDiv;
  }
}

var outcomeUI = {
  domPlayerPanel: function(){ return $('#game-players'); },
  domOutcomePanel: function(){ return $('#turn-outcomes'); },
  domOutcomeList: function(){ return outcomeUI.domOutcomePanel().children('ul').first(); },
  domOutcomePages: function() { return $('#outcome-pages'); },	
  domPlayerStatus: function(playerId) { return $('#player-status-'+playerId); },
  didAttackHit: function(attack) {
    return attack.hit+'' === 'true';
  },
  isScratching: function(attack) {
    return attack.cmd === 'scratch';	
  },
  isVisible: function() {
    return outcomeUI.domOutcomePanel().is(":visible");
  },
  setPlayerStatus: function(status, playerId) {
	  outcomeUI.domPlayerStatus(playerId).html(status ? '('+ status+')' : '');
  },
  displayOutcomePage: function(outcome) {
	var list = outcomeUI.domOutcomeList();
    var li = $('<li></li>');
    var desciptionPara = $('<p>'+outcome.description+'</p>');
    desciptionPara.appendTo(li);

    function addScratch(paperdoll) {
	  var scratch = $("<img class='scratches' src='/img/avatars/scratchmarks.png'>");
	  paperdoll.prepend(scratch);
    }

    function addTarget(target, scratched) {
      var paperdoll = avatarUI.createPaperdoll(0);
      paperdoll.addClass('flip');
	  if (scratched) addScratch(paperdoll);
	
      paperdoll.appendTo(li);
    }

    function addAttacker(attacker) {
	  var paperdoll = avatarUI.createPaperdoll(0, attacker.cmd);
	  paperdoll.css("margin-left","-20px");
	  paperdoll.appendTo(li);
    }

    var scratched = false;
    if (outcome.attackers) {
	  for (var idx = 0; idx < outcome.attackers.length; idx++) {
		var attacker = outcome.attackers[idx];
		addAttacker(attacker);
		if (outcomeUI.isScratching(attacker) && outcomeUI.didAttackHit(attacker)) {
		  scratched = true;
		}
	  }
    }

    if (outcome.targets) {
	  for (var idx = 0; idx < outcome.targets.length; idx++) {
		var target = outcome.targets[idx];
		addTarget(target, scratched);
	  }
    }

    li.appendTo(list);
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
	  dramaUI.humiliateAvatar(targetId);
	
	  if (dramaUI.userId+''===targetId+'') {
	    dramaUI.removeGame(); // player herself was humiliated so remove all game controls
	  }
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

    if (data.length === 1) outcomeUI.setNextAboutToClose(true);

    dramaUI.hidePlayerPanel();
    dramaUI.showOutcomePanel();
  },
  setNextAboutToClose: function	(aboutToClose) {
	if (aboutToClose === true) {
	  outcomeUI.next.html('Close');
	} else {
	  outcomeUI.next.html('Next');
    };
  },
  init: function(list){	
    var isAnimating = false;
    var next = outcomeUI.next = $('#' + list.data('next') );
    var previous = outcomeUI.previous = $('#' + list.data('previous') );

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
      var closingPanel = (numberOfPages === 1 && delta === -1) || 
                         (pageDelta <= -numberOfPages);
      if (closingPanel) {
	    dramaUI.hideOutcomePanel();
	    dramaUI.showPlayerPanel();
	    outcomeUI.setNextAboutToClose();
	    return false;
      } 

      var isAboutToClosePanel = pageDelta === -numberOfPages+1;
      outcomeUI.setNextAboutToClose(isAboutToClosePanel);

      changePosition(delta);
      return false;
    }	
	
    next.click(function() { return paginate(-1); });
    previous.click(function() { return paginate(1); });
  }	
};

var dramaUI = {
  userId: null,	
  domConnectionStatus: function(){ return $('#chat-status').children('span').first(); },
  domChatBubble: function(userId) { return $('#player-chat-'+userId); },
  domChatButton: function(){ return $('#game-console-submit'); },
  domChatBox: function(){ return $('#game-message'); },	
  domReadyButton: function(){ return $('#player-ready'); },
  domTattleButton: function(){ return $('#player-tattle'); },	
  domMedButton: function(){ return $('#player-lick'); },
  domOutcomePanel: function(){ return $('#outcome-pages'); },	
  domPaperdoll: function(userId){ return $('#paperdoll-'+userId); },
  domPaperdollArms: function(userId) { return $('#paperdoll-'+userId+'-arms'); },
  domKickButton: function(userId) { return $('#player-'+userId+'-kick'); },

  stripNonNumeric: function(text) {
    return (text || '').replace(/[^0-9]/g, ''); 
  },

  humiliateAvatar: function(userId) {	
	dramaUI.domPaperdollArms(userId).remove();
	dramaUI.domPaperdoll(userId).attr('src', avatarUI.defeatedStance);
  },
  useTattle: function() {
    var tattles = dramaUI.domTattleButton().data('count');
    tattles = parseInt(tattles) - 1;
    dramaUI.domTattleButton().text('Tattle '+tattles);
    dramaUI.domTattleButton().data('count', tattles);
  },
  useMed: function() {
    var meds = dramaUI.domMedButton().data('count');
    meds = parseInt(meds) - 1;
    dramaUI.domMedButton().text('Med '+meds);
    dramaUI.domMedButton().data('count', meds);
  },
  printMessage: function(message, userId) {
	var maxMessageElements = 25;
	if (dramaUI.domChatBubble(userId).children('p').length >= maxMessageElements) {
	  dramaUI.domChatBubble(userId).children('p').last().remove();
	}
	
	var element = $('<p>'+message+'</p>');
    element.prependTo(dramaUI.domChatBubble(userId));
  },
  setTurn: function(turn) {
    $('#status').html( turn );
  },
  setPlayerEsteem: function(userId, delta) {
    var esteemBox = $('#player-esteem-'+userId);
    var esteem = esteemBox.children('li').length;

    if (delta < 0){
	  for (idx = 0; idx > delta; idx--) {
		if (esteemBox.children.length === 0) break;
		esteemBox.children('li:last').remove();
	  }
    } else if (delta > 0) {
	  for (idx = 0; idx < delta; idx++) {
	    var li = $("<li>&hearts;</li>")
	    li.appendTo(esteemBox);
	  }
    }
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
    $('.command:not(.kick)').attr('disabled', 'disabled').addClass('disabled');
    $('.kick').removeAttr('disabled').removeClass('disabled');
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
    dramaUI.domReadyButton().attr('disabled', 'disabled').addClass('diminished').unbind().text('Waiting...');
  },
  removeReadyControl: function() {
	dramaUI.domReadyButton().remove();
  },
  removeKickControls: function() {
	$('.kick').remove();
  },
  showCommandButtons: function() {
	$('.command').show();
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
    dramaUI.domConnectionStatus().text(status);
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
  initKickControls: function(socket) {
    var kickAction = function(e) {
      e.preventDefault();

      var btn = $(this);
      var userId = btn.parents('li').attr('id');
      var packet = {userId: userId};
      socket.emit('kick', packet, function(err, doc) {
	    if (!err) {
		  if (btn.hasClass('selected')) {
			btn.removeClass('selected');
		  } else {
			btn.addClass('selected');
		  }
	    };
      });
	
      return false;
    };
    $('.kick').live('click', kickAction);	
  },
  initGameControls: function(socket) {
    var gameAction = function(e) {
      e.preventDefault();

      var btn = $(this);
      var cmd = btn.data('command');
      var userId = btn.parents('li').attr('id');
      var packet = {command: 'action', action: {command: cmd, targetId: userId }};

      socket.emit('game', packet, function(err, doc) {
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

  var TRANSPORTS = ['flashsocket','xhr-polling','jsonp-polling','htmlfile'];	
  var ONE_SECOND = 1000;

  var gameAPI = {
    gameInterval: null,
    clearGameInterval: function() { 
	  if (gameAPI.gameInterval) {
		clearInterval(gameAPI.gameInterval);
	  }
	},
	rotateElement: function (element, angle) {
	  var deg = 'rotate('+angle+'deg)';
	  element.css('WebkitTransform', deg);
	  element.css('MozTransform', deg);
	  element.css('MsTransform', deg);
	  element.css('OTransform', deg);
	  element.css('Transform', deg);
	  element.css('Zoom', 1);
	
      if (element.css("filter") !== undefined) {
        var cos = Math.cos(Math.PI * 2 / 360 * angle);
        var sin = Math.sin(Math.PI * 2 / 360 * angle);

        element.css("filter","progid:DXImageTransform.Microsoft.Matrix(M11="+cos+",M12=-"+sin+",M21="+sin+",M22="+cos+",SizingMethod='auto expand',FilterType='nearest neighbor')");
        element.css("left",-Math.floor((element.width()-50)/2));
        element.css("top",-Math.floor((element.height()-50)/2));
      };	
	},
	tickTimer: function (current, total) {
	  var clock = gameAPI.domTimer();
	  var angle = (360/total)*(current+1);
	  var element;
	
	  var isBeginningRotation = current === 0;
	  if (isBeginningRotation) {
		gameAPI.resetTimer();
	  }

	  if (angle <= 180) {
		element = clock.rotateLeft;
	  }	else {
		clock.rotateRight.show();
		clock.rotateLeft.show();

		gameAPI.rotateElement(clock.rotateLeft,180);
		element = clock.rotateRight;
		angle = Math.min(angle-180, 180); // right should not exceed 180 degress
	  }
	  gameAPI.rotateElement(element, angle);
	  var displayTime = current+1;
	  gameAPI.setTimerDisplay(displayTime);
	},
	setTimerDisplay: function(seconds) {
	  seconds = parseInt(seconds);
	  var displayTime = seconds < 10 ? '0'+seconds : seconds;
	  gameAPI.domTimerDisplay().html(displayTime);
	},
	resetTimer: function() {
	  var timer = gameAPI.domTimer();
	  timer.rotateRight.hide();
	  gameAPI.rotateElement(timer.rotateLeft, 0);
	  gameAPI.setTimerDisplay(0);
	},
	setGameInterval: function(currentSeconds, timeLength, colorClass) {
	  var timer = gameAPI.domTimer();
	  var color = colorClass || 'green';
	  var cssClass = timer.attr('class').replace('orange',color).replace('blue',color).replace('green',color);
	
	  gameAPI.gameInterval = setInterval(function() {
	    gameAPI.tickTimer(currentSeconds, timeLength);
		currentSeconds++;
		
		var intervalHasFinished = currentSeconds > timeLength;
		if (intervalHasFinished) {
		  gameAPI.clearGameInterval();
		  return;
		}
	  }, ONE_SECOND);
	
	  timer.attr('class', cssClass);
	
		
      // gameAPI.gameInterval = setInterval(function() {
      //   var seconds = time % parseInt($('#game').attr('data-duration'));
      //   if (seconds < 10) seconds = "0" + seconds; 
      //   dramaUI.setClock(seconds);
      //   time--;
      // 
      //   if(time === 0) {
      // 	      setTimeout(function() { dramaUI.setClock("00") }, ONE_SECOND);
      //     gameAPI.clearGameInterval();
      //     return;
      //   }
      // }, ONE_SECOND);
	},
	domTimer: function() { 
	  var timer = $('#timer');
	  timer.rotateLeft = timer.find('.rotate.left');
	  timer.rotateRight = timer.find('.rotate.right');
	  return timer; 
	},
	domTimerDisplay: function(){ return $('#turn-timer'); },
    domGameStatus: function(){ return $('#status'); },
    domPlayerStatus: function(playerId) { return $('#player-status-'+playerId); },
    turnDuration: function() { return parseInt( $('#game').data('duration') ); },
    cooldownDuration: function() { return parseInt( $('#game').data('cooldown') ); },
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
    startCountdown: function(currentSeconds, turnLength) {
	  currentSeconds = currentSeconds || 0;
	  turnLength = turnLength || gameAPI.turnDuration();
	
      gameAPI.setGameInterval(currentSeconds, turnLength, 'blue');
    },
    startCooldown: function() {
      gameAPI.setGameInterval(0, gameAPI.cooldownDuration());
    },   
    turnStarted: function(data) {
      gameAPI.clearGameInterval();
      gameAPI.resetTimer();
      gameAPI.startCountdown();

      dramaUI.setTurn('Now playing turn  ' + data.turn.cnt);
      dramaUI.enableGame();
      dramaUI.hideOutcomePanel()
      dramaUI.showPlayerPanel();
    },
    turnEnded: function(data) {	
      dramaUI.disableGame();
      gameAPI.clearGameInterval();
      outcomeUI.displayOutcome( data.turn.outcome );

      dramaUI.setTurn('Waiting for next turn');
      dramaUI.blurGame();
      gameAPI.startCooldown();
    },
    playerKicked: function(data) {
	  if (data.kicked+'' === 'true') {
		var ownPlayerKicked = data.userId+'' === dramaUI.userId+'';
		if (ownPlayerKicked) {
	      window.top.location = "/games";
		} else {
		  dramaUI.removePlayer(data.userId);
		}
	  } else {
	    dramaUI.domKickButton(data.userId).text("Boot "+data.cnt);
	  }
    },
    playerReady: function(data) {
      var id = data.player._id;
      var status = data.player.status;
      gameAPI.setPlayerStatus('active', id);
    },
    gameStarted: function(data){
	  dramaUI.removeKickControls();
	  dramaUI.removeReadyControl();
	  gameAPI.turnStarted( {"turn":{"cnt":1}} );
	  dramaUI.showCommandButtons();
    },
    gameEnded: function(data) {
	  dramaUI.removeGame();
      gameAPI.clearGameInterval();
      gameAPI.resetTimer();
      dramaUI.setTurn('Game over');

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

      if (!outcomeUI.isVisible()) {
	    outcomeUI.clearOutcomePages();
	    outcomeUI.displayOutcomePage(outcome);
	    outcomeUI.setNextAboutToClose(true);
        dramaUI.hidePlayerPanel();
        dramaUI.showOutcomePanel();
      } else {
	    outcomeUI.displayOutcomePage(outcome);
      }
    },
    playerQuit: function(data) {
      var id = data.player._id;

      if (gameAPI.isGameInProgress()) {
	    dramaUI.disableTargetPlayer(id);
	    dramaUI.humiliateAvatar(id);
        gameAPI.setPlayerStatus('quit', id);
      } 
      else {
	    dramaUI.removePlayer(id);
      };
    },
    playerJoined: function(data) {
      var name = data.player.nick;
      var id = data.player._id;	

      function makePlayerElement(li) { 
        li.attr('id', id);
	
	    var chatBubble = $("<p id='player-chat-"+id+"' class='chat-bubble'></p>");
	    var esteem = "<ul id='player-esteem-"+id+"' class='esteem'>";
	    for (idx = 0; idx < 10; idx++) {
		  esteem = esteem + "<li>&hearts;</li>";
	    }
	    esteem = esteem + "</div>";
	    esteem = $(esteem);
	
	    var paperdoll = avatarUI.createPaperdoll(id);
	    var nickLink = "<a href='/profiles/"+id+"' class='popup'>"+name+"</a>";
	    var title = $("<span class='player-nick'>"+ nickLink+" <span id='player-status-"+id+"'>(pending)</span></span>");

	    var ctrlDiv = $("<div id='player-target-controls-"+id+"' class='player-controls'></div");
	    var kick = $("<button type='button' id='player-"+id+"-kick' class='command kick orange'>Boot 0</button>");
	    var tease = $("<button type='button' class='command red hidden' data-command='tease' disabled='disabled'>Tease</button>&nbsp;");
	    var scratch = $("<button type='button' class='command red hidden' data-command='scratch' disabled='disabled'>Scratch</button>&nbsp;");
	    var grab = $("<button type='button' class='command red hidden' data-command='grab' disabled='disabled'>Grab</button>");

	    chatBubble.appendTo(li);
	    esteem.appendTo(li);
	    title.appendTo(li);
	    paperdoll.appendTo(li);

	    kick.appendTo(ctrlDiv);
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
      $.playSound({file: '/sfx/girl-enter'});
    }
  };

  function onChatEvent(data) { 
	var userId = (data.player || {})._id;
	dramaUI.printMessage(data.message, userId);
  };
  function onPlayerEvent(data) {
	if (window.console) console.log("player event!!!! "+JSON.stringify(data))
    switch (data.event) {
	    case 'joined':
	      gameAPI.playerJoined(data);
	      break;	
	    case 'kick':
	      gameAPI.playerKicked(data);
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
	if (window.console) console.log("turn event!!!! "+JSON.stringify(data))
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
	if (window.console) console.log("game event!!!! "+JSON.stringify(data))
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
        if (data.authorized) {
	      function registerSocketEvents(sckt) {
		    sckt.on('player', onPlayerEvent);
		    sckt.on('game', onGameEvent);
		    sckt.on('turn', onTurnEvent);
		    sckt.on('chat', onChatEvent);
          }
          registerSocketEvents(socket);

          socket.userId = data.userId;
          dramaUI.userId = data.userId;

          dramaUI.setConnectionStatus('connected');	
          dramaUI.initChatControls(socket, data.userId);
          dramaUI.enableChat(socket);
          dramaUI.initGameControls(socket);
          dramaUI.initKickControls(socket);
	
	      function registerReadyButton(sckt) {
            if (gameAPI.isPlayerReady(data.userId)) {
	          dramaUI.readyToWaiting();
	        } else {
              dramaUI.initReadyControl(sckt);
		      dramaUI.enableReadyButton();
            }
	      }
	      registerReadyButton(socket);

          /*
	      function registerConfirmPageDeparture() {
			$(window).unload(function() {
			  // quit player
			});		
	      }
	      registerConfirmPageDeparture();
		  */
		
          function intiateCountdownIfInProgress() {
	        if (gameAPI.isGameInProgress() && !gameAPI.isGameInCooldown()) {
              var seconds = dramaUI.stripNonNumeric( gameAPI.domTimerDisplay().html() );
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
        dramaUI.setConnectionStatus('unconnectable');
	  }
	  function onReconnecting(){
        dramaUI.setConnectionStatus('reconnecting');
	  };
	  function onReconnect(){
        dramaUI.setConnectionStatus('reconnected');
        dramaUI.enableChat();
	  };
	  function onReconnectFailure(){
        dramaUI.setConnectionStatus('unconnectable');
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