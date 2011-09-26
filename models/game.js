var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var plyr = require('./player')
var trn = require('./turn');
var scr = require('./score').Model;
var re = require('./../lib/mechanics/resolution_engine');

var GAME_TYPES = ['public', 'private', 'friends'];
var GAME_STATUS = ['pending', 'active', 'cooldown', 'ended', 'quit'];
var GAME_SPEEDS = ['fast', 'slow'];
var MAX_PLAYERS = 6;
var MIN_PLAYERS = 3;
var MIN_WINNERS = 2;
var MIN_TURNS = 3;
var MAX_TURNS = 50;
var TURN_DURATION = 60;
var COOLDOWN_DURATION = 30;

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(err, data);	
  }
}

function required(val) { return val && val.length; }
function maxPlayers(val) { return !val || !val.length || val.length <= MAX_PLAYERS; }

var schema = new Schema({
  userId: String,
  title: {type: String, validate: required},
  type: {type: String, default: 'pending', enum: GAME_TYPES, validate: required},
  status: {type: String, default: 'pending', enum: GAME_STATUS, validate: required },
  pace: {type: String, default: 'fast', enum: GAME_SPEEDS},
  money: {type: Number, default: 0},
  start: Date,
  end: Date,
  players: { type: [plyr.Schema], validate: maxPlayers},
  turns: [trn.Schema],
  ts: { type: Date, default: Date.now() }
});

var gameStatusIndex =  {'status': 1};
var gameStatusPlayerIndex = { '_id': 1, 'status': 1, 'players.userId': -1 };
schema.index(gameStatusIndex);
schema.index(gameStatusPlayerIndex);

var model = mongoose.model('Game', schema);

model.create = function(params, callback) {
  var game = null;
  game = new model(params);

  game.save(function (err) {
	doCallback(callback, err, game);
  });
}

model.prototype.createPlayer = function(userId, nick, callback) {
  var isGameJoinable = this.status === 'pending';
  var existingPlayer = this.getPlayer(userId) && this.status === 'active';

  if (existingPlayer) {
	doCallback(callback, "Already playing", existingPlayer);
  } else if (isGameJoinable) {
    var player = {userId: userId, nick: nick};
    this.players.push(player);

    this.save(function (err) {
	  doCallback(callback, err, player);
    });
  } else {
	doCallback(callback, "Cannot join");
  }
}

model.prototype.getPlayerAndIndex = function(userId) {
  for(var idx = 0; idx < this.players.length; idx++) {
    p = this.players[idx];
    if (p.userId+'' === userId+'') {
	  return [p, idx];
	}
  }
  return [false, -1];
}

model.prototype.getPlayer = function(userId) {
  for(var idx = 0; idx < this.players.length; idx++) {
    p = this.players[idx];
    if (p.userId+'' === userId+'') return p;
  }
  return false;
}

model.prototype.deletePlayer = function(userId, playerIndex, callback) {
  // clear any of the deleted player's kick votes
  var updated = false;
  for (idx = 0; idx < this.players.length; idx++) {
    if ( this.setKick(this.players[idx], userId, true) ) {
	  updated = true;
    }
  }

  var game = this;
  function removeAndCallback() {
	game.players[playerIndex].remove();
	game.save(function(err, doc) {
	  console.log("deletePlayer "+err)
	  doCallback(callback, err, doc);
	});
  }

  if (updated) {	
	this.save(function(err, doc) {
		console.log("deletePlayer "+err)
	  removeAndCallback();
	});
  } else {
	removeAndCallback();
  }
}

model.prototype.quitPlayer = function(userId, callback) {
  var playerParts = this.getPlayerAndIndex(userId);	
  var player = playerParts[0];
  var playerIndex = playerParts[1];

  if (player && !this.isEnded()) {
    if (this.isPending()) {
	  this.deletePlayer(userId, playerIndex, function(err) {	
        doCallback(callback, err, game);
	  });
    } else if (this.isInProgress()) {
	  player.status = 'quit';
	  player.esteem = 0;
      var game = this;
      this.save(function (err) {
	    console.log("quitplayer "+err)
        doCallback(callback, err, game);
      });
    };
  }
  else {
	doCallback(callback, "No player or active game");
  };
}

model.prototype.readyPlayer = function(userId, callback) {
  var playerParts = this.getPlayerAndIndex(userId);
  var player = playerParts[0];
  var playerIndex = playerParts[1];

  if (player && !this.isEnded()) {	
    this.players[playerIndex].status = 'active';
    this.save(function (err) {
	  doCallback(callback, err, player);
    });
  }
  else {
	doCallback(callback, "No player or active game");
  };
}

model.prototype.setKick = function(player, userId, removeOnly) {
  removeOnly = removeOnly || false;
  var hasKick = false;	
	
  // if player has already voted for a vote then retract it, otherwise add the vote
  for (var idx = 0; idx < player.kicks.length; idx++) {
    if (player.kicks[idx]+'' === userId+'') {
      hasKick = true;
	  player.kicks.splice(idx,1);
	  console.log("spliced kick away")
      break;
    }
  }
  if (!removeOnly && !hasKick) {
	player.kicks.push(userId);
	console.log("pushed kick up")
  }
  return hasKick;
}

model.prototype.kickPlayer = function(userId, targetId, callback) {
  if (!this.isPending()) {
	doCallback(callback, "Can't boot unless game is pending");
    return;
  }
console.log("game kickPlayer targetId="+targetId+" userId="+userId);
	
  var playerParts = this.getPlayerAndIndex(targetId);
  var player = playerParts[0];
  var playerIndex = playerParts[1];
	
  if (player) {		
	var kicks = player.kicks || [];
	
	console.log("kickPlayer kicks "+JSON.stringify(player.kicks));
	console.log("kickPlayer players "+JSON.stringify(this.players));
	
	var hasKick = this.setKick(player, userId);
	
	console.log("kickPlayer kicks "+JSON.stringify(player.kicks));	
	console.log("hasKick "+hasKick)
	
	function kickOut(game, result) {
	  result.kicked = true;
	  console.log(JSON.stringify(game.players))
	  game.deletePlayer(targetId, playerIndex, function(err) {
		console.log("is kicked "+err)
        doCallback(callback, err, result);
	  });
	}
	
    this.save(function(err, doc) {
	  var cnt = player.kicks.length;
	  var isKicked = cnt > (doc.players.length / 2);
	  var result = {'cnt': cnt};
	
	console.log("kickPlayer save "+err+' '+cnt+ ' '+doc.players.length+'/2');	
	
	  if (isKicked) {	
		// if player was kicked then remove them from the game
		kickOut(doc, result);
	  } else {
		doCallback(callback, err, result);
	  }
    });	
  }
  else {
	doCallback(callback, "No player");
  };
}

model.prototype.getActionForTurn = function(userId, turn) {
  var actions = (turn || {}).actions || [];
  for(var idx = 0; idx < actions.length; idx++) { // does player exist in turn actions?
    var action = turn.actions[idx];
    if (userId+'' === action.userId+'' ) {
      return action;
    }
  };
}

model.prototype.createAction = function(userId, targetId, command, callback) {
  var player = this.getPlayer(userId);
  var target = this.getPlayer(targetId);
	
  var notActive = this.status !== 'active';
  var playerNotActive = player && player.status !== 'active';
  var missingPlayerOrTarget = !player || !target;
  var targetAlreadyHumiliated = target && target.esteem === 0;
  var medsDepleted = command === 'med' && player.meds < 1;
  var tattlesDepleted = command === 'tattle' && player.tattles < 1;
  var usingMedsAtFullEsteem = command === 'med' && player.esteem >= plyr.DefaultEsteem;

  if (playerNotActive || missingPlayerOrTarget) {
	doCallback(callback, "Could not create action");
	return;
  } else if (notActive) {
	doCallback(callback, "Game is inactive");
	return;		
  } else if (targetAlreadyHumiliated) {
	doCallback(callback, "Target already humiliated");
	return;	
  } else if (medsDepleted) {
	doCallback(callback, "No remaining meds");
	return;	
  } else if (tattlesDepleted) {
	doCallback(callback, "No remaining tattles");
	return;	
  } else if (usingMedsAtFullEsteem) {
	doCallback(callback, "Cannot take meds at full esteem");	
    return;
  }

  var turn = this.getCurrentTurn();
  var isTargetingSelf = userId+'' === targetId+'';
  if (isTargetingSelf) {
	targetId = null;
  }

 
  var self = this;
  function removeExistingPlayerAction() {
	var wasFound = false;	
    for(var idx = 0; idx < turn.actions.length; idx++) {
	  var actionForPlayer = turn.actions[idx].userId+'' === userId+'';
      if (actionForPlayer)	{
	    if (self.turns[self.turns.length-1].actions[idx]) { // guard
	      self.turns[self.turns.length-1].actions[idx].remove(); 
	      wasFound = true;
	      break;
	    }
      }
    }
    return wasFound;
  }
  function addNewAction(action) {
    var wasRemoved = removeExistingPlayerAction();

    if (wasRemoved) {
	  // mongoose must save twice, once for pop and once for push
      self.save(function (err) {
        turn.actions.push(action);
        self.save(function (err) {
	      console.log(JSON.stringify(action))
          doCallback(callback, err, action);	
        });	
      });
    } else {
	  turn.actions.push(action);
      self.save(function (err) {
        console.log(JSON.stringify(action))
        doCallback(callback, err, action);
      });
	}

	

  }

  var action = {userId: userId, cmd: command, targetId: targetId};
  addNewAction(action)
}

model.prototype.getCurrentTurn = function() {
  return this.turns[this.turns.length - 1];
}

model.prototype.getTurnDuration = function() {
  return (this.pace === 'fast') ? TURN_DURATION : TURN_DURATION * 2;
}

model.prototype.getCooldownDuration = function() {
  return (this.pace === 'fast') ? COOLDOWN_DURATION : COOLDOWN_DURATION + 15;
}

model.prototype.getSurvivingPlayers = function() {
  var surviving = this.players.filter( function(player){
	var esteem = player.esteem;
    return parseInt(esteem) > 0;
  })
  return surviving;	
}

model.prototype.getDefeatedPlayers = function() {
  var defeated = this.players.filter( function(player){
	var esteem = player.esteem;
    return parseInt(esteem) === 0;
  })
  return defeated;	
}

model.prototype.getPlayerIds = function() {
  var ids = [];
  for (var idx = 0; idx < this.players.length; idx++) { ids.push(this.players[idx].userId); }
  return ids;
}

model.prototype.startDrama = function(callback) {
  if (!this.isPending()) return;

  this.status = 'active';
  this.start = Date.now();

  var self = this;
  this.createTurn(function(err, turn){
	doCallback(callback, err, self);
  });
}

model.prototype.createTurn = function(callback) {
  var turn = {cnt: this.turns.length+1, actions: [], ts: Date.now() };
  this.turns.push(turn);
  this.save(function(err) {
	doCallback(callback, err, turn);
  });
}

model.prototype.startTurn = function(callback) {
  if (this.isEnded()) return;

  this.status = 'active';
  this.createTurn(function(err, turn) {
	doCallback(callback, err, turn);
  });
}

model.prototype.endTurn = function(callback) {
  if (this.isEnded()) return;

  this.status = 'cooldown';
  this.resolveTurn(function (err, outcome) {
	doCallback(callback, err, outcome);
  })
}

model.prototype.resolveTurn = function(callback, turn) {
  if (this.isEnded()) {
	doCallback(callback, "Cannot resolve turns when ended");
	return; 
  }
	
  var game = this;	
  var turn = (turn === undefined) ? this.getCurrentTurn() : turn;
  re.Resolve(game, turn, function(err, outcome) {
	if (err) {
	  doCallback(callback, err);	
	} else {
	  game.saveAfterTurn(function (err){
		doCallback(callback, err, outcome);
	  });
	}
  })
}

model.prototype.saveAfterTurn = function(callback) {
  if (this.isGameOver()) this.status = 'ended';

  this.save(function(err, doc){
	doCallback(callback, err, doc);
  });	
}

model.prototype.setMoney = function(callback) {
  var lids = [];
  var losers = this.getDefeatedPlayers();
  for (var idx = 0; idx < losers.length; idx++) { 
	lids.push(losers[idx].userId);
  }

  var self = this;
  var scores = scr.findLastUserScores(lids, function(err, docs) {
	console.log("scr.findLastUserScores "+err+" "+docs.length)
	if (err || docs.length < 1) {
	  doCallback(callback, err);
	} else {
	  var tally = 0;
	  for (var idx = 0; idx < docs.length; idx++) { 
		tally = tally + docs[idx].pop; 
	  }
	  tally = tally / docs.length;
	  self.money = Math.max(parseInt(tally), 1);
	  doCallback(callback, null, self.money);
	}
  });
}

model.prototype.scoreWinners = function(callback) {
  var scores = [];

  var winners = this.getSurvivingPlayers();
  if (winners.length > 2) {	
    doCallback(callback, "Too many surviving players");
	return;
  }
  var firstWinner = winners[0];
  var secondWinner = (winners.length > 1) ? winners[1] : null;

  scr.createScore(this._id, firstWinner, function(err, firstDoc) {	
    if (firstDoc) scores.push(firstDoc);

	if (secondWinner) {
	  scr.createScore(this._id, secondWinner, function(err, secondDoc) {
		if (secondDoc) scores.push(secondDoc);
		doCallback(callback, err, scores);
	  });
	} else {
	  doCallback(callback, err, scores);
	}
  });
}

model.prototype.quit = function(callback) {
  this.status = 'quit';
  this.save(function(err, doc){
	doCallback(callback, err, doc);
  });  
}

model.prototype.isInProgress = function() {
  return this.isActive() || this.isCooldown();
}

model.prototype.isActive = function() {
  return this.status === 'active';
}

model.prototype.isCooldown = function() {
  return this.status === 'cooldown';
}

model.prototype.isPending = function() {
  return this.status === 'pending';
}

model.prototype.isEnded = function() {
  return this.status === 'ended' || this.turns.length >= MAX_TURNS;
}

model.prototype.isGameOver = function() {
  return this.hasMinimumSurvivors();
}

model.prototype.hasPlayers = function() {
  return this.players && this.players.length > 0;
}

model.prototype.hasActivePlayers = function() {
  if (this.players.length < 1) return false;
  var activeCount = 0;
  for (var idx = 0; idx < this.players.length; idx++) {
	var stat = this.players[idx].status;
	if (stat === 'active' || stat === 'pending') {
	  activeCount = activeCount+1;
	};
  }
  return activeCount > 0;
}

model.prototype.hasMinimumPlayers = function() {
  return this.players.length >= MIN_PLAYERS;
}

model.prototype.hasMinimumSurvivors = function() {
  var survivorCount = this.getSurvivingPlayers().length
  return survivorCount > 0 && survivorCount <= MIN_WINNERS;
}

model.prototype.hasAllPlayersReady = function() {
  for(var idx = 0; idx < this.players.length; idx++) {
    if (this.players[idx].getValue('status') === 'pending') return false;
  }
  return true;
}

model.prototype.hasAllPlayersActedForTurn = function() {
  var turn = this.getCurrentTurn();
  if (!turn) return;

  var allPlayersActed = (turn.actions.length === this.players.length);
  return allPlayersActed;
}

model.prototype.hasMinimumTurns = function() {
  return this.turns.length >= MIN_TURNS;
}

module.exports = {
  Schema: schema,
  Model: model
}