var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var usr = require('./../../models/user').Model;
var gam = require('./../../models/game');
var gm = require('./../../models/game').Model;
var tckr = require('./ticker');
var events = require('events');

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(err, data);	
  }
}

var GameTracker = function (){
  events.EventEmitter.call(this);

  this.TurnDuration = gam.TurnDuration;
  this.CooldownDuration = gam.CooldownDuration;
  this.isUserGaming = function(userId, callback, gameId) {
	var params = {
	  'players.userId': userId, 
	  'players.status': {'$nin': ['quit','shamed']}, 
	  'status': {'$ne': 'ended'}
	};
	gm.findOne(params, function(err, doc){
	  var isGaming = !err && doc && doc._id;
	  if (isGaming) {
		var excludeGameId = (gameId && gameId+'' === doc._id+'');
		
	    if (excludeGameId) {
		  callback(doc);
		} else {
		  callback(true);
	    }
	  } else {
		callback(false);
	  }
	});
  }
};

GameTracker.super_ = events.EventEmitter;
GameTracker.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: GameTracker,
    enumerable: false
  }
})

GameTracker.prototype.getTicker = function() {
  if (!this.ticker) this.ticker = tckr.Ticker(this);
  return this.ticker;
}

GameTracker.prototype.findGames = function(callback) {
  var params = {'status': {$nin: ['ended','quit']}};	
  gm.find(params, function(err, docs){
	doCallback(callback, err, docs);
  });	
}

GameTracker.prototype.findGame = function(gameId, callback) {
  var activeGameParams = {_id: gameId, status: {$ne : 'ended' }};

  gm.findOne(activeGameParams, function(err, doc){
	doCallback(callback, err, doc);
  });
}

GameTracker.prototype.joinGame = function(gameId, userId, nick, callback) {
  var self = this;
	
  var playerCanJoin = function() {
    var params = {_id: gameId, status: {$ne : 'ended' }};

    gm.findOne(params, function(err, doc) {
	  if (doc) {
		doc.createPlayer(userId, nick, function(err, playerDoc){
  	      if (!err) {
		    self.emit('playerJoined', {_id: userId, nick: nick}, gameId);
          }		  	
	      callback(err, doc);
	    });
	  } else {
	    callback(err);
	  }
    });    	
  }
  var tryToJoin = function(gameOrIsGaming) {
	var isNotGaming = gameOrIsGaming === false;
	var isAlreadyInGame = gameOrIsGaming != false && gameOrIsGaming != true && gameOrIsGaming._id;
	var isGamingElsewhere = gameOrIsGaming === true;
	
	if (isNotGaming) {
	  playerCanJoin();
	} else if (isGamingElsewhere) {
	  callback(true);
	} else if (isAlreadyInGame) {
	  callback(null, gameOrIsGaming);
	}
  }	
	
  this.isUserGaming(userId, tryToJoin, gameId);
}

GameTracker.prototype.quitGame = function(gameId, userId, callback) {
  var self = this;	

  var params = {'_id': gameId, 'players.userId': userId, 'status': {'$ne' : 'ended' }};
  gm.findOne(params, function(err, doc) {
	if (doc) {
	  doc.quitPlayer(userId, function(err, doc) {
		if (doc.hasActivePlayers()) {	
	      self.emit('playerQuit', {'_id': userId}, gameId );
	    } else if (doc.hasPlayers()) {
		  doc.quit( function(err){
		    self.emit('gameEnded', doc);
		  });
	    } else {
		  self.emit('gameEnded', doc);
		  doc.remove();
		};
		doCallback(callback, err, doc);
	  });
	} else {	
	  doCallback(callback, (err || "No game found"));
	}
  });
}

GameTracker.prototype.createGame = function(title, type, userId, nick, callback){
  var gameParams = { title: title, type: type, host: userId, start:null, end:null };
  var self = this;
  var newGame;

  function addFirstPlayerAndFinalize(err, player) {
	self.emit('gameCreated', newGame);
    if (typeof callback === 'function') callback(err, newGame);
  }
  function addGame(err, game) {
    if (err) {
      if (typeof callback === 'function') callback(err);
    } else {
	  newGame = game;
      newGame.createPlayer(userId, nick, addFirstPlayerAndFinalize);
    }	
  }

  this.isUserGaming(userId, function(isGaming){
	if (isGaming) {
      if (typeof callback === 'function') callback("is already gaming");
	} else {	
      var game = gm.create(gameParams, addGame);
    }
  })
}

GameTracker.prototype.dispatchCommand = function(cmd, gameId, userId, callback) {
  switch (cmd.command) {
    case 'quit':
      this.quitGame(gameId, userId, callback);
      break;
    case 'ready':
      this.playerReady(gameId, userId, callback);
      break;	
    case 'action':
      this.playerAction(gameId, userId, cmd.action, callback);
      break;	
  }	
}

GameTracker.prototype.playerAction = function(gameId, userId, packet, callback){
  console.log("player turn action "+JSON.stringify(packet));

  var cmd = packet.command;	
  var targetId = packet.targetId;
  var hasValidTarget = !!targetId;
  if (!hasValidTarget) return false;
 
  var gt = this
  this.findGame(gameId, function(err, doc) {
	if (doc) {
	  var player = doc.getPlayer(userId);
	  var playerIsAuthorized = player && player.status === 'active';
	
	  console.log("action playerIsAuthorized? "+playerIsAuthorized)
	  if (playerIsAuthorized) {
		function onAction(err, action) {
		  if (err) {
			console.log("action err: "+err)
			doCallback(callback, err, action);
		  } else if (doc.hasAllPlayersActedForTurn()) {
		      // // clear timeout so turn isn't ended twice
		      // if (game.timeoutId !== undefined) { 
		      //   clearTimeout( game.timeoutId ); 
		      //   game.timeoutId = null;
		      // 	          };
			console.log("action ending turn")
		    gt.endTurn(game);
			doCallback(callback, err, action);
		  } else {	
			console.log("action saved")
			doCallback(callback, err, action);
		  }
		}
		
		doc.createAction(userId, targetId, cmd, onAction);
	  } else {
		doCallback(callback, "Could not find authorized player");
	  }
	} else {
	  doCallback(callback, "Could not find game");
	}
  });
}

GameTracker.prototype.playerReady = function(gameId, userId, callback){
  function gameShouldStartNow(game) {
	return game.hasMinimumPlayers() && game.hasAllPlayersReady();
  }

  var gm = this;
  this.findGame(gameId, function (err, doc) {
	if (doc) {
	  doc.readyPlayer(userId, function(err, player){
		if (player) {
		  function onDrama(err, game) {	
		    gm.emit('gameStarted', game, gameId);
		    gm.getTicker().startTurnCountdown(game);
		
            doCallback(callback, err, player);
		  };
			
		  if (gameShouldStartNow(doc)) {
			doc.startDrama(onDrama);
		  } else {
			doCallback(callback, err, player);
		  }
		  gm.emit('playerReady', player, gameId);
		} else {
		  doCallback(callback, err);
		}
	  });
	} else {
	  doCallback(callback, err);
	}
  });
}

GameTracker.prototype.startTurn = function(game, turn) {
  this.emit('turnStarted', game);	
  this.getTicker().startTurnCountdown(game);
}

GameTracker.prototype.endTurn = function(game) {
  var gt = this;
  game.endTurn(function (err, outcome) {
    outcome.game = game;
    gt.emit('turnEnded', game, outcome);

    if (game.isEnded()) {
      gt.emit('gameEnded', game, outcome);
    } else {
      gt.getTicker().startTurnCooldown(game);
    }
  }); 
}

var trkr = new GameTracker();
module.exports = {
  GameTracker: GameTracker,	
  Main: trkr
}