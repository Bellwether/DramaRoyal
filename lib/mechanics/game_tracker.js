var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var usr = require('./../../models/user').Model;
var gm = require('./../../models/game').Model;
var tckr = require('./ticker');
var events = require('events');

var GameTracker = function (){
  events.EventEmitter.call(this);

  this.ticker = tckr.Ticker(this);
  this.isUserGaming = function(userId, callback, gameId) {
	var params = {'players.userId': userId, 'status': {'$ne' : 'ended' }};
	
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

GameTracker.prototype.findGame = function(gameId, callback){
  var activeGameParams = {_id: gameId, status: {$ne : 'ended' }};

  gm.findOne(activeGameParams, function(err, doc){
	if (typeof callback === 'function') callback(err, doc);
  });
}

GameTracker.prototype.joinGame = function(gameId, userId, callback){
  var self = this;
	
  var playerCanJoin = function() {
    var params = {_id: gameId, status: {$ne : 'ended' }};

    gm.findOne(params, function(err, doc){
	  if (doc) {
		doc.createPlayer(userId, function(err, playerDoc){
  	      if (err) {
		    callback(err);
	      } else {
		    self.emit('playerJoined', doc, gameId);
		    callback(err, doc);
          }		  
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