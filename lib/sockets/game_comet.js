var gt = require('./../mechanics/game_tracker');
var usr = require('./../../models/user');

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(data);	
  }
}

function authenticateUserSession(sessionId, callback) {
  usr.Model.findBySessionId(sessionId, callback);
}

var gameEvents = function(socket) {
  function emitGameEvent(evnt, data, type) {
	console.log("+++ emitGameEvent "+evnt+" "+type);
    type = type || 'game';
    data = data || {};
    data.event = evnt;
    socket.json.emit('game', data );
  }
	
  return {	
    gameStarted: function(game) {
      var packet = {'game': {'_id': game._id, 'title': game.title, 'players': []}};
      emitGameEvent( 'started', packet );
    },
    gameEnded: function(game) {
      var packet = {'game': {'_id': game._id }, 'winners': []};
      var winners = game.survivingPlayers();
	  for(var idx = 0; idx < winners.length; idx++) {
	    packet.winners.push( { '_id': packet[idx]._id, 'name': packet[idx].name } );
	  }
      emitGameEvent('ended', packet);
    },
    turnStarted: function(game) {
	  var cnt = game.getCurrentTurn().cnt;
	  var packet = {"turn": {"cnt": cnt } };
      emitGameEvent('started', packet, 'turn');
    },
    turnEnded: function(game, outcome) {
	  var cnt = game.getCurrentTurn().cnt;
	  var packet = {"turn": {"cnt": cnt, "outcome": outcome }};
      emitGameEvent('ended', packet, 'turn');
    },
    playerReady: function(player) {
  	console.log("++playerReady")
	  var packet = {"player": {"_id": player.playerId }};
      emitGameEvent('ready', packet, 'player');
    },
    playerAction: function(game, player) {
	  var packet = {"player": {"_id": player._id}};
      emitGameEvent('action', packet, 'player');
    },
    playerJoined: function(player) {
	  var packet = {"player": {"_id": player._id}};
      emitGameEvent('joined', packet);
    },
    playerQuit: function(player) {
	  var packet = {"player": {"_id": player._id}};
      emitPlayerEvent('quit', packet);
    }
  }
}

function broadcastOnDisconnect(socket, gameId, gameEvents) {
  socket.on('disconnect', function () {
    removeGameEvents(gameEvents);
	var packet = {'message': 'girl left the game'};
	socket.broadcast.to(gameId).json.emit('chat', packet );
  });
}

function broadcastOnChat(socket, gameId, userId) {
  socket.on('chat', function (msg, callback) {
	var packet = {'message': msg, 'player': {'_id': userId}};
	socket.broadcast.to(gameId).json.emit('chat', packet );
	doCallback(callback, null, true);
  });
}

function listenOnGameCommand(socket, gameId, userId) {
  socket.on('game', function (cmd, callback) {
	gt.Main.dispatchCommand(cmd, gameId, userId, callback);
  });
}

function emitOnGameEvents(socket) {
  var ge = gameEvents(socket);
	
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

function initLobbySocket(socket, userId, gameId) {
  socket.emit('authorized', {'authorized': true, 'userId': userId});

  var joinPacket = {'message': 'girl entered the drama'};
  socket.broadcast.to(gameId).json.emit('announcement', joinPacket);

  broadcastOnChat(socket, gameId, userId);
  var gameEvents = emitOnGameEvents(socket)
  broadcastOnDisconnect(socket, gameId, gameEvents);
  listenOnGameCommand(socket, userId, gameId);
}

function joinGame(socket, userId, gameId) {
  var gameChannel = gameId;	
  socket.join(gameChannel);

  socket.set('userId', userId, function (){
	socket.set('userName', 'girl'+(userId+'').substr(0,4), function (){ 
	  socket.set('gameId', gameId, function (){
  	    initLobbySocket(socket, userId, gameId);
      });	
	});
  });
}

var connectToGame = function (socket) {
  socket.once('authorizeUser', function (sessionId, gameId) {
	authenticateUserSession(sessionId, function(err, doc) {
      if (doc) {
        joinGame(socket, doc._id, gameId);
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