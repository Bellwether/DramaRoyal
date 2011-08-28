var TATTLE_ESTEEM = 3;

function getActionsByType (actions, type, effectiveResults) {
  if (!(type instanceof Array)) { type = [type] }; // accept string or array parameter
  var filtered = [];
  var typeString = type.join();

  var filtered = actions.filter( 
    function(action){ 
	  return (typeString.indexOf( action.cmd ) >= 0);
	}
  );

  // if existing results were given, filter actions by effective actions only
  if (effectiveResults) {
	filtered = filtered.filter( function(el){ 
	  return effectiveResults[ el.userId ].effective 
	});	
  }

  return filtered;
}

function isAttacking(result) {
  return result.action.cmd === 'tease' || 
         result.action.cmd === 'scratch' || 
         result.action.cmd === 'grab';
}

function isVulnerable(result) {
  return result.action.cmd === 'scratch' || 
	     result.action.cmd === 'tease' || 
	     result.action.cmd === 'lick';	
}

var EffectProcessor = function(turn, results, lastTurn) {
  this.turn = turn;
  this.lastTurn = lastTurn;
  this.results = results;

  this.processTattleResults = function() {
    var tattles = getActionsByType(turn.actions, 'tattle');
    var esteemLost = TATTLE_ESTEEM;
    var playerTattled = (tattles.length === 1);
    var playersTattled = (tattles.length > 1);

    if (playerTattled) {
	  // one player tattled, so punish all other player who are attacking
	  for(var key in results) {
	    var result = results[key];
	
        if (result.userId+'' != tattles[0].userId+'') {
	      if (isAttacking(result)) {
		    result.esteem = result.esteem - esteemLost;
		  }
        }	
      };
    } else if (playersTattled) {
      // multiple players tattled, so all were ineffective and loose esteem
      for(var idx = 0; idx < tattles.length; idx++) {
	    var result = results[tattles[idx].userId];
	    result.esteem = result.esteem - esteemLost;
	    result.effective = false;
      }
    };
  }  
  this.processGrabResults = function() {
    var grabs = getActionsByType(turn.actions, 'grab');

    for(var idx = 0; idx < grabs.length; idx++) {
	  var result = results[grabs[idx].targetId];
	
	  if (isVulnerable(result)) {
	    result.effective = false;

  	    // remove from target's attacks
	    var target = results[result.action.targetId];

	    if (target) {
	      for(var idx = 0; idx < target.attacks.length; idx++) {
		    var isIneffectiveAttack = target.attacks[idx].userId+'' === result.userId+'';
		    if (isIneffectiveAttack) {
			  target.attacks.splice(idx,1);
 		    };
	      }
	    }
	  }
    }	
  }  
  this.processTeaseResults = function() {
  }  
  this.processScratchResults = function() {
  }  
  this.processLickResults = function() {
  }  
  this.processCowerResults = function() {
  }

  return this;
}

module.exports = {
  init: EffectProcessor
}