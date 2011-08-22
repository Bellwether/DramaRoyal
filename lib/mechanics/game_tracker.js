var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var usr = require('./../../models/user').Model;
var gm = require('./../../models/game').Model;
var tckr = require('./ticker');
var events = require('events');

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(data);	
  }
}

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

GameTracker.prototype.findGames = function(callback) {
  var params = {'status': {$ne : 'ended' }};	
  gm.find(params, function(err, docs){
	if (typeof callback === 'function') callback(err, docs);
  });	
}

GameTracker.prototype.findGame = function(gameId, callback) {
  var activeGameParams = {_id: gameId, status: {$ne : 'ended' }};

  gm.findOne(activeGameParams, function(err, doc){
	console.log(err + " "+doc+" "+JSON.stringify(activeGameParams))
	if (typeof callback === 'function') callback(err, doc);
  });
}

GameTracker.prototype.joinGame = function(gameId, userId, callback) {
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

GameTracker.prototype.quitGame = function(gameId, userId, callback) {
  var self = this;	

  var params = {'_id': gameId, 'players.userId': userId, 'status': {'$ne' : 'ended' }};
  gm.findOne(params, function(err, doc) {
	if (doc) {
	  doc.quitPlayer(userId, function(err, doc) {
		if (doc.hasPlayers()) {	
	      self.emit('playerQuit', {"_id": userId} );
	    } else {
		  self.emit('gameEnded', {'_id': gameId });
		  doc.remove();
		};		
        if (typeof callback === 'function') callback(err, doc);
	  });
	} else {
	  if (typeof callback === 'function') callback(err || "No game found");	
	}
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

GameTracker.prototype.playerReady = function(gameId, userId, callback){
  function gameShouldStartNow(game) {
	return game.hasMinimumPlayers() && game.hasPlayersReady();
  }

  var gm = this;
  this.findGame(gameId, function (err, doc) {
	if (doc) {
	  doc.readyPlayer(userId, function(err, player){
		if (player) {
		  if (gameShouldStartNow(doc)) {
			doc.startGame( function(err, game) {
			  gm.emit('gameStarted', game, gameId);
			  this.ticker.startTurnCountdown(game);
			
              doCallback(callback, err, player);
			});
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

var trkr = new GameTracker();
module.exports = {
  GameTracker: GameTracker,	
  Main: trkr
}