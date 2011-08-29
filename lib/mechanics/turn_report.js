var tr = require('./turn_result');
var ae = require('./action_effects');

function isAttacking(action) {
  return action === 'scratch' ||
	     action === 'grab' ||
	     action === 'tease';	
}
function isPassive(action) {
  return action === 'med' || 
         action === 'cower' ||
         action === 'nothing';	
}
function isTattling(action) {
  return action === 'tattle';	
}
function isAttacked(result) {
  return result.attacks.length > 0;
}

var describer = {
  tattles: [],
  passives: [],
  actives: [],
  attackers: [],
  getActionResult: function(actions, userId) {
    for (var idx = 0; idx < actions.length; idx++) {
	  if (userId+'' === actions[idx].userId+'') return actions[idx];
    };	
    return null;
  },
  init: function(tattles, passives, actives, attackers) {
	describer.tattles = tattles;
	describer.passives = passives;
	describer.actives = actives;
	describer.attackers = attackers;
  },
  describeTattles: function(outcome) {
    var result = new tr.TurnResult();
	
	var hasOneTattle = describer.tattles.length === 1;
	var hasManyTattles = describer.tattles.length > 1;
	
	function suppressTattleDamage(targetId) {
	  var res = describer.getActionResult(actives, targetId);
	  if (res) res.esteem = res.esteem + ae.TattleEsteem;
	}	
	
	function describeOneTattle() {
	  var uid = describer.tattles[0].userId;
	  var nick = describer.tattles[0].nick;
	  var description = nick+' tattled';
	  outcome.trackPlayerTattleUse(uid);
	
	  for (var idx = 0; idx < attackers.length; idx++) {
		var attack = attackers[idx];
	    var action = attack.action.cmd;
	    var target = {'userId': attack.userId, 'nick': attack.nick};
        result.targets.push(target);
        suppressTattleDamage(target.userId);
	  };
	  var playersGotInTrouble = (result.targets.length > 0);

	  if (playersGotInTrouble) {
	    for (var idx = 0; idx < result.targets.length; idx++) {
          description = description + ' and ' + result.targets[idx].nick;	
	    }
	    description = description + ' got in trouble.';
	  }
	  else {
	    description = description + ' but nobody got in trouble.';
	  };	
	
	  result.description = description;
	  result.esteem = -ae.TattleEsteem;
	  outcome.push(result);
	}
	
	function describeManyTattles() {
	  var description = '';
	
	  for (var idx = 0; idx < describer.tattles.length; idx++) {
		var tattle = describer.tattles[idx];
	    var uid = tattle.userId;
	    var nick = tattle.nick;
	
        description = (idx === 0 ? nick+' ' : description+' and '+nick );
        result.trackPlayerTattleUse(uid);
        result.targets.push(uid);

        if (tattle.isHumiliated()){
	      outcome.trackPlayerHumiliation(uid); 	
        }
	  }	
	  description = description+' got each other in trouble.';	
	
      if (result.humiliations) {
	    description = description =' The humiliation was too great for ';
	    for(var idx = 0; idx < outcome.humiliations.length; idx++) {
		  var nick = outcome.humiliations[idx];
		  description = (idx === 0 ? nick+' ' : description+' and '+nick );
	    }
	    description = description + ' and so they collapsed in a puddle of tears! :( :( :('; 
      }

	  result.description = description;
	  result.esteem = -ae.TattleEsteem;
	  outcome.push(result);	
	}
	
	if (hasOneTattle) {
	  describeOneTattle();	
	} else if (hasManyTattles) {
	  describeManyTattles();
	}
  },
  describePassives: function(outcome) {
	
  },
  describeActives: function(outcome) {
	
  },
}

var generateReport = function(results) {
  var report = [];

  // groups are formed in three cases: for tattling, for passive innocents, and for individual targets
  var tattles = [];
  var passives = [];
  var actives = [];
  var attackers = [];	

  for(var userId in results) {
	var result = results[userId];
	var action = reslt.action.cmd;
	
	if (isAttacking(action)) attackers.push(result);
	
	if (isTattling(action)) { 
      tattles.push(result);
    } else if (isPassive(action) && !isAttacked(result)) {
	  passives.push(result);
	  continue;
    }

    if (isAttacked(result)) {
	  actives.push(result);
    }
  }

  describer.init(tattles, passives, actives, attackers);
  describer.describeTattles(outcomes);
  describer.describePassives(outcomes);
  describer.describeActives(outcomes);

  return report;
}

module.exports = {
  init: generateReport	
}