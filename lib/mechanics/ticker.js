var Ticker = function (gameTracker){
  this.gameTracker = gameTracker;	
  var milliseconds = 1000;

  function startTurnCountdown(game) {
    var g = game;
    var delayInSeconds = gameTracker.TurnDuration * milliseconds;
    console.log("start turn countdown for "+delayInSeconds+" seconds")

    var timeout = setTimeout(function() { 
      console.log("timeout callback:  gameTracker.endTurn(game)")
      gameTracker.endTurn(game);
    }, delayInSeconds);
  }

  function startTurnCooldown(game) {
    var g = game;
    var delayInSeconds = gameTracker.CooldownDuration * milliseconds;
    console.log("start turn cooldown for "+delayInSeconds+" seconds")

    var onTurn = function(err, turn) {
	  if (turn) {
        gameTracker.startTurn(game, turn);
	  }
    }

    setTimeout(function() { 
      g.startTurn(onTurn); 
    }, delayInSeconds);
  }

  return {
    startTurnCountdown: startTurnCountdown,
    startTurnCooldown: startTurnCooldown
  }
};

module.exports = {
  Ticker: Ticker
}