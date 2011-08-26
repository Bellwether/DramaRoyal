var gm = require('./../../models/game').Model;

var expirationLimit = 3;
var milliseconds = 1000;
var minutes = milliseconds * 60;
var hours = minutes * 60;
var expirationHours = expirationLimit * hours;
var sweeperIntervalId = null;

function getExpirationDate() {
  var expiredAt = new Date(Date.now());
  var hrs = expiredAt.getHours() - expirationLimit;
  expiredAt.setHours(hrs);
  return expiredAt;
}

function startSweeping() {
  if (sweeperIntervalId) clearInterval(sweeperIntervalId);

  var endExpiredGames = function() {
    var expiredAt = getExpirationDate();

    var params = {'status': {$ne: 'ended'}, 'ts': {$lt: expiredAt}};
    gm.update(params, {'status': 'ended'}, {multi: true}, function(err, doc) {
	  if (err) {
	    console.log("ERROR: could not sweep games");
        console.log(err);
      } else {
	    console.log("SWEPT "+doc+" expired games");
	  }
	  sweeperIntervalId = setInterval(endExpiredGames, expirationHours);
    })	
  }

  endExpiredGames();
}

module.exports = {
  init: startSweeping
}