var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var plyr = require('./player')
var trn = require('./turn');

var GAME_TYPES = ['public', 'private', 'friends'];
var GAME_STATUS = ['pending', 'active', 'cooldown', 'ended'];
var MAX_PLAYERS = 6;
var MIN_PLAYERS = 3;
var MAX_TURNS = 50;
var TURN_DURATION = 60;
var COOLDOWN_DURATION = 30;

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
    if (typeof callback === 'function') callback(err, game);
  });
}

model.prototype.createPlayer = function(userId, nick, callback) {
  var isGameJoinable = this.status === 'pending';

  if (isGameJoinable)	{
    var player = {userId: userId, nick: nick};
    this.players.push(player);

    this.save(function (err) {
      callback(err, player);
    });
  } else {
	callback(false);
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
      if (typeof callback === 'function') callback(err, game);
    });	
  }
  else {
    if (typeof callback === 'function') callback("No player or active game");
  };
}

model.prototype.readyPlayer = function(userId, callback) {
  var playerParts = this.getPlayerAndIndex(userId);	
  var player = playerParts[0];
  var playerIndex = playerParts[1];

  if (player && !this.isEnded()) {	
    this.players[playerIndex].status = 'active';
    this.save(function (err) {
      if (typeof callback === 'function') callback(err, player);
    });
  }
  else {
    if (typeof callback === 'function') callback("No player or active game");
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

model.prototype.createTurn = function(callback) {
  var turn = {cnt: this.turns.length+1, actions: [], ts: Date.now() };
  this.turns.push(turn);
  this.save(function(err) {
	if (typeof callback === 'function') callback(err, turn);
  });
}

model.prototype.startTurn = function(callback) {
  if (this.isEnded()) return;

  this.status = 'active';
  this.createTurn(function(err, turn) {
	if (typeof callback === 'function') callback(err, turn);
  });
}

model.prototype.endTurn = function(callback) {
  if (this.isEnded()) return;

  this.status = 'cooldown';
  this.resolveTurn(function (err, outcome) {
	if (typeof callback === 'function') callback(err, outcome);
  })
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

model.prototype.hasPlayers = function() {
  return this.players && this.players.length > 0;
}

model.prototype.hasMinimumPlayers = function() {
  return this.players.length >= MIN_PLAYERS;
}

model.prototype.hasAllPlayersReady = function() {
  for(var idx = 0; idx < this.players.length; idx++) {
    p = this.players[idx];
    if (p.status === 'pending') return false;
  }
  return true;
}

module.exports = {
  Schema: schema,
  Model: model
}