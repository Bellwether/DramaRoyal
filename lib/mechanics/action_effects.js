var TATTLE_ESTEEM = 3;
var TEASE_ESTEEM = 2;
var SCRATCH_ESTEEM = 1;
var MEDS_ESTEEM = 2;
var COWARD_PENALTY = 1;

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
function getPlayerActionForTurn(userId, turn) {
  for(var idx = 0; idx < turn.actions.length; idx++) {
    var action = turn.actions[idx];
    var isUserMatch = userId+'' === action.userId+'';

    if (isUserMatch) return action;
  };
  return null;
}
function isAttacking(result) {
  return result.action.cmd === 'tease' || 
         result.action.cmd === 'scratch' || 
         result.action.cmd === 'grab';
}
function isVulnerable(result) {
  return result.action.cmd === 'scratch' || 
	     result.action.cmd === 'tease' || 
	     result.action.cmd === 'med';	
}
function wasCowering(userId, turn) {
  var action = getPlayerActionForTurn(userId, turn);	
  return action.cmd === 'cower';
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
	  var tattlerId = tattles[0].userId;
	  var tattleWasEffective = false;
	  for(var key in results) {
	    var result = results[key];
	    var isOwnPlayer = result.userId+'' === tattlerId+'';
	
        if (!isOwnPlayer && isAttacking(result)) {
	      tattleWasEffective = true;
		  result.deductEsteem(esteemLost);
        }	
      };

      if (!tattleWasEffective) {
	    results[tattlerId].defective();
	  };
    } else if (playersTattled) {
      // multiple players tattled, so all were ineffective and loose esteem
      for(var idx = 0; idx < tattles.length; idx++) {
	    var result = results[tattles[idx].userId];
	    result.deductEsteem(esteemLost);
	    result.defective();
      }
    };
  }  
  this.processGrabResults = function() {
    var grabs = getActionsByType(turn.actions, 'grab');

    for(var idx = 0; idx < grabs.length; idx++) {
	  var result = results[grabs[idx].targetId];
	
	  if (isVulnerable(result)) {	
	    result.defective();

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
    for(var key in results) {
	  var result = results[key];
	  if (result.effective === false) continue; // skip unless successful attack

      var teases = getActionsByType(result.attacks, 'tease');

      if (teases.length === 1) { // requires two or more teases to have effect
	    results[teases[0].userId].defective();
      } else if (teases.length > 1) {
	    var totalEsteemLost = ((teases.length * TEASE_ESTEEM) -TEASE_ESTEEM);
	    result.deductEsteem(totalEsteemLost);
      }
    };	
  }  
  this.processScratchResults = function() {
    for(var key in results) {
	  var result = results[key];
	  var isCowering

      var scratches = getActionsByType(result.attacks, 'scratch');

      if (scratches.length > 0) {
	    if (result.action.cmd === 'cower') { 
		  // cowering avoids scratches
	      for(var idx = 0; idx < scratches.length; idx++) {
		    results[scratches[idx].userId].defective();
 	      }
	    } else {
		  var totalEsteemLost = SCRATCH_ESTEEM;

          // if player is also grabbed, scratches do double damage
	      var grabs = getActionsByType(result.attacks, 'grab');
	      if (grabs.length > 0) totalEsteemLost = totalEsteemLost * 2;

          // if player is meding, scratches do extra damage
	      if (result.action.cmd === 'med') {
		    result.defective();
		    totalEsteemLost = totalEsteemLost + 1;
	      }

          totalEsteemLost = scratches.length * totalEsteemLost;
	      result.deductEsteem(totalEsteemLost);
        }	
      };
    };	
  }  
  this.processMedResults = function() {
    var meds = getActionsByType(turn.actions, 'med');

    for(var idx = 0; idx < meds.length; idx++) {
      var key = meds[idx].userId;
      var result = results[key];

	  if (result.isEffective()) {
	    results[key].esteem = result.esteem + MEDS_ESTEEM;
	  }
    }	
  }  
  this.processCowerResults = function() {
	var hasLastTurn = turn.cnt >= 2 && lastTurn !== undefined;
	if (!hasLastTurn) return;

	var cowers = getActionsByType(turn.actions, 'cower');
	for(var idx = 0; idx < cowers.length; idx++) {
	  var userId = cowers[idx].userId;

	  // punish repeat cowards
	  if (wasCowering(userId, lastTurn)) {
	    var result = results[userId];
	    result.deductEsteem(COWARD_PENALTY);
	    result.coward();
	  }
	};	
  }

  return this;
}

module.exports = {
  init: EffectProcessor,
  getActionsByType: getActionsByType,
  TattleEsteem: TATTLE_ESTEEM,
  TeaseEsteem: TEASE_ESTEEM,
  ScratchEsteem: SCRATCH_ESTEEM,
  MedsEsteem: MEDS_ESTEEM,
  CowardPenalty: COWARD_PENALTY
}