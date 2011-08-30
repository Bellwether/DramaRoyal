var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var plyr = require('./player')
var trn = require('./turn');
var re = require('./../lib/mechanics/resolution_engine');

var GAME_TYPES = ['public', 'private', 'friends'];
var GAME_STATUS = ['pending', 'active', 'cooldown', 'ended', 'quit'];
var MAX_PLAYERS = 6;
var MIN_PLAYERS = 3;
var MAX_TURNS = 50;
var TURN_DURATION = 5;
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
  type: { type: String, default: 'pending', enum: GAME_TYPES, validate: required},
  status: { type: String, default: 'pending', enum: GAME_STATUS, validate: required },
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

model.prototype.getSurvivingPlayers = function() {
  var surviving = this.players.filter( function(player){
	var esteem = player.getValue('esteem');
    return esteem > 0;
  })
  return surviving;	
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

model.prototype.quitPlayer = function(userId, callback) {
  var playerParts = this.getPlayerAndIndex(userId);	
  var player = playerParts[0];
  var playerIndex = playerParts[1];

  if (player && !this.isEnded()) {
    if (this.isPending()) {
      this.players[playerIndex].remove();
    } else if (this.isInProgress()) {
	  player.status = 'quit';
	  player.esteem = 0;
    };

    var game = this;
    this.save(function (err) {
      doCallback(callback, err, game);
    });	
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

model.prototype.getActionForTurn = function(userId, turn) {
  var actions = (turn || {}).actions || [];
  for(var idx = 0; idx < actions.length; idx++) { // does player exist in turn actions?
    var action = turn.actions[idx];
    if (userId+'' === action.userId+'' ) {
      return action;
    }
  };
}

model.prototype.getCurrentTurn = function() {
  return this.turns[this.turns.length - 1];
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
	  if (game.isGameOver()) game.status = 'ended';
	  game.save(function(err){
		doCallback(callback, err, outcome);
	  });
	}
  })
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
  return this.status === 'ended';
}

model.prototype.isGameOver = function() {
  return this.getSurvivingPlayers().length <= 2;
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

model.prototype.hasAllPlayersReady = function() {
  for(var idx = 0; idx < this.players.length; idx++) {
    if (this.players[idx].getValue('status') === 'pending') return false;
  }
  return true;
}

module.exports = {
  Schema: schema,
  Model: model,
  TurnDuration: TURN_DURATION,
  CooldownDuration: COOLDOWN_DURATION
}