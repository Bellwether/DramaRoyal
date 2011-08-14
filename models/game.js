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

model.prototype.createPlayer = function(userId, callback) {
  var isGameJoinable = this.status === 'pending';

  if (isGameJoinable)	{
    var player = {userId: userId};
    this.players.push(player);

    this.save(function (err) {
      callback(err, player);
    });
  } else {
	callback(false);
  }
}

module.exports = {
  Schema: schema,
  Model: model
}