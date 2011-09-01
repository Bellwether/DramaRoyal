var milliseconds = 1000;

var Ticker = function (gameTracker){
  var self = this;
  this.gameTracker = gameTracker;

  var api = {
	timeoutIds: {},
	setTimeoutId: function(gameId, timeoutId) {
	  api.timeoutIds[gameId] = timeoutId;
	},
	clearTimeoutId: function(gameId) {
	  var timeoutId = api.timeoutIds[gameId];
	  if (timeoutId) {	
	    clearTimeout(timeoutId); 
	    delete timeoutId;
	  }
	}	
  };

  function startTurnCountdown(game) {
    var delayInSeconds = gameTracker.TurnDuration * milliseconds;
    console.log("start turn countdown for "+delayInSeconds+" seconds")

    var timeout = setTimeout(function() { 
      console.log("*** *** *** timeout callback:  gameTracker.endTurn(game)")
      gameTracker.endTurn(game);
    }, delayInSeconds);
    api.setTimeoutId(game._id, timeout); // store timeout id in case the turn ends abruptly
  }

  function startTurnCooldown(game) {
    var delayInSeconds = gameTracker.CooldownDuration * milliseconds;
    console.log("start turn cooldown for "+delayInSeconds+" seconds")

    var onTurn = function(err, turn) {
	  if (turn) {
        gameTracker.startTurn(game, turn);
	  }
    }

    var timeout = setTimeout(function() { 
      game.startTurn(onTurn); 
    }, delayInSeconds);
  }

  api.startTurnCountdown = startTurnCountdown;
  api.startTurnCooldown = startTurnCooldown;
  this.api = api;
  return this.api;
};

module.exports = {
  Ticker: Ticker
}