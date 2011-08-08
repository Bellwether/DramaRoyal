var usr = require('./../../models/user').Model;
var gm = require('./../../models/game').Model;
var tckr = require('./ticker');
var events = require('events');

var GameTracker = function (){
  events.EventEmitter.call(this);

  this.ticker = tckr.Ticker(this);
  this.isUserGaming = function(userId, callback, gameId) {
	var params = { 'players': {userId: userId }};
	
	gm.findOne(params, function(err, doc){
	  var isGaming = !err && doc && doc._id;
	  if (isGaming) {
		var excludeGameId = (gameId === doc._id);
	    if (excludeGameId) {
		  callback(gameId);
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

GameTracker.prototype.findGame = function(gameId, callback){
  var activeGameParams = {_id: gameId, status: {$ne : 'ended' }};

  gm.findOne(activeGameParams, function(err, doc){
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
      newGame.createPlayer(userId, addFirstPlayerAndFinalize);
    }	
  }

  this.isUserGaming(userId, function(isGaming){
	if (isGaming) {
      if (typeof callback === 'function') callback(true);
	} else {	
      var game = gm.create(gameParams, addGame);
    }
  })
}

var trkr = new GameTracker();
module.exports = {
  GameTracker: GameTracker,	
  Main: trkr
}