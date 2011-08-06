var usr = require('./../../models/user').Model;
var gm = require('./../../models/game').Model;
var events = require('events');

var GameTracker = function (){
  events.EventEmitter.call(this);

  this.isUserGaming = function(userId, callback) {
	gm.findOne({ 'players.userId': userId }, {_id: 1}, function(err, doc){
	  var isGaming = !err && doc && doc._id;
	  callback(isGaming);
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

GameTracker.prototype.findGame = function(gameId, callback){
  var activeGameParams = {_id: gameId, status: {$ne : 'ended' }};

  model.findOne(activeGameParams, function(err, doc){
	if (typeof callback === 'function') callback(err, doc);
  });
}

GameTracker.prototype.createGame = function(title, type, userId, callback){
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
      newGame.addPlayer(userId, addFirstPlayerAndFinalize);
    }	
  }

  this.isUserGaming(userId, function(isGaming){
	if (isGaming) {
      var game = gm.create(gameParams, addGame);
	} else {
      if (typeof callback === 'function') callback(true);	
    }
  })
}

var trkr = new GameTracker();
module.exports = {
  GameTracker: GameTracker,	
  Main: trkr
}