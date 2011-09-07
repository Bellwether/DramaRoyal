var gt = require('./../mechanics/game_tracker');
var usr = require('./../../models/user');

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(data);	
  }
}

function consoleLogSocket(socket) {
  console.log("")	
  console.log("SOCKET INFO:")	
  console.log("socketid = "+socket.id);
  console.log("rooms: ");
  console.log(util.inspect(socket.manager.rooms));
  console.log("lobby clients: ");
  console.log("open: "+util.inspect(socket.manager.open));
  console.log("closed: "+util.inspect(socket.manager.closed));
  console.log("connected: "+util.inspect(socket.manager.connected));
}

function authenticateUserSession(sessionId, callback) {
  usr.Model.findBySessionId(sessionId, callback);
}

var gameEvents = function(socket, gameId) {
  function emitGameEvent(evnt, data, type) {
    type = type || 'game';
    packet = data || {};
    packet.event = evnt;

    socket.json.emit(type, data);
  }
	
  return {	
    gameStarted: function(game) {
      var packet = {'game': {'_id': game._id, 'title': game.title, 'players': []}};
      emitGameEvent( 'started', packet );
    },
    gameEnded: function(game) {
      var packet = {'game': {'_id': game._id }, 'winners': []};
      var winners = game.getSurvivingPlayers();
	  for(var idx = 0; idx < winners.length; idx++) {
	    packet.winners.push({ '_id': winners[idx]._id, 'nick': winners[idx].nick });
	  }
      emitGameEvent('ended', packet);
    },
    turnStarted: function(game) {
	  var cnt = game.getCurrentTurn().cnt;
	  var packet = {"turn": {"cnt": cnt } };
      emitGameEvent('started', packet, 'turn');
    },
    turnEnded: function(game, outcome) {
	  console.log("emitting turnEnded ")
	  var cnt = game.getCurrentTurn().cnt;
	  var packet = {"turn": {"cnt": cnt, "outcome": outcome }};
      emitGameEvent('ended', packet, 'turn');
    },
    playerReady: function(player) {
	  var packet = {"player": {"_id": player.userId }};
      emitGameEvent('ready', packet, 'player');
    },
    playerAction: function(game, player) {
	  var packet = {"player": {"_id": player._id}};
      emitGameEvent('action', packet, 'player');
    },
    playerJoined: function(player) {
	  var packet = {"player": {"_id": player._id, "nick": player.nick}};
      emitGameEvent('joined', packet, 'player');
    },
    playerQuit: function(player) {
	  var packet = {"player": {"_id": player._id}};
      emitGameEvent('quit', packet, 'player');
    }
  }
}

function broadcastOnDisconnect(socket, gameId, gameEvents) {
  socket.on('disconnect', function () {
    removeGameEvents(gameEvents);
	var packet = {'message': 'girl left the game'};
	socket.broadcast.to(gameId).json.emit('chat', packet);
  });
}

function broadcastOnChat(socket, gameId, userId, nick) {
  socket.on('chat', function (msg, callback) {
	var packet = {'message': msg, 'player': {'_id': userId, 'nick': nick}};
	socket.broadcast.to(gameId).json.emit('chat', packet );
	doCallback(callback, null, true);
  });
}

function listenOnGameCommand(socket, gameId, userId) {
  socket.on('game', function (cmd, callback) {
	gt.Main.dispatchCommand(cmd, gameId, userId, callback);
  });
}

function emitOnGameEvents(socket, gameId) {
  console.log("emitOnGameEvents initialized")	
  var ge = gameEvents(socket, gameId);
	
  gt.Main.on('gameStarted', ge.gameStarted);
  gt.Main.on('gameEnded', ge.gameEnded);
  gt.Main.on('turnStarted', ge.turnStarted);
  gt.Main.on('turnEnded', ge.turnEnded);
  gt.Main.on('playerQuit', ge.playerQuit);
  gt.Main.on('playerJoined', ge.playerJoined);
  gt.Main.on('playerReady', ge.playerReady);
  gt.Main.on('playerAction', ge.playerAction);

  return ge;
}

function removeGameEvents(gameEvents) {
  var gs = gameEvents.gameStarted;
  var ge = gameEvents.gameEnded;
  var ts = gameEvents.turnStarted;
  var te = gameEvents.turnEnded;
  var pq = gameEvents.playerQuit;
  var pj = gameEvents.playerJoined;
  var pr = gameEvents.playerReady;
  var pa = gameEvents.playerAction;

  gt.Main.removeListener('gameStarted', gs);
  gt.Main.removeListener('gameEnded', ge);
  gt.Main.removeListener('turnStarted', ts);
  gt.Main.removeListener('turnEnded', te);
  gt.Main.removeListener('playerQuit', pq);
  gt.Main.removeListener('playerJoined', pj);
  gt.Main.removeListener('playerReady', pr);
  gt.Main.removeListener('playerAction', pa);
}

function initLobbySocket(socket, userId, nick, gameId) {
  socket.emit('authorized', {'authorized': true, 'userId': userId});

  var gameEvents = emitOnGameEvents(socket, gameId);

  broadcastOnChat(socket, gameId, userId, nick);
  broadcastOnDisconnect(socket, gameId, gameEvents);
  listenOnGameCommand(socket, gameId, userId);
}

function joinGame(socket, userId, nick, gameId) {
  var gameChannel = gameId;	
  socket.join(gameChannel);

  socket.set('userId', userId, function (){
	socket.set('userName', nick, function (){ 
	  socket.set('gameId', gameId, function (){
  	    initLobbySocket(socket, userId, nick, gameId);
      });	
	});
  });
}

var connectToGame = function (socket) {
  socket.once('authorizeUser', function (sessionId, gameId) {
	authenticateUserSession(sessionId, function(err, doc) {
      if (doc) {
        joinGame(socket, doc._id, doc.avatar.nick, gameId);
      } else {	
	    socket.emit('authorized', false);
        socket.disconnect();
      }		
    });
  });
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToGame );
  }
}