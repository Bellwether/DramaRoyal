var Ticker = function (gameTracker){
  this.gameTracker = gameTracker;	
  var milliseconds = 1000;

  function startTurnCountdown(game) {
    var g = game;
    var delayInSeconds = gm.TurnDuration * milliseconds;

    var context = this;	
    var timeout = setTimeout(function() { 
      gameTracker.endTurn(g);
    }, delayInSeconds);
  }

  function startTurnCooldown(game) {
    var g = game;
    var delayInSeconds = gm.CooldownDuration * milliseconds;
    var context = this;

    var onTurn = function(err, turn) {
	  if (turn) {
        gameTracker.startTurn(game,turn);
	  }
    }

    setTimeout(function() { 
      g.startTurn(onTurn); 
    }, delayInSeconds);
  }
};

module.exports = {
  Ticker: Ticker
}