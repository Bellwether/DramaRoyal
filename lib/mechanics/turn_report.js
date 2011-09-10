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
	  var res = describer.getActionResult(describer.actives, targetId);
	  console.log("suppressTattleDamage: targetId="+targetId+', res='+JSON.stringify(res))
	  if (res) res.esteem = res.esteem + ae.TattleEsteem;
	}	
	
	function describeOneTattle() {
	  var uid = describer.tattles[0].userId;
	  var nick = describer.tattles[0].nick;
	  var description = nick+' tattled';
	  result.trackPlayerTattleUse(uid);
	  result.addAttacker(uid, nick, 'tattle');
	
	  for (var idx = 0; idx < describer.attackers.length; idx++) {
		var attack = describer.attackers[idx];
	    var action = attack.action.cmd;
        result.addTarget(attack.userId, attack.nick);
        suppressTattleDamage(attack.userId);
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
        result.addTarget(uid);

        if (tattle.isHumiliated()){
	      result.trackPlayerHumiliation(uid); 	
        }
	  }	
	  description = description+' all tattled and got each other in trouble.';	
	
      if (result.humiliations) {
	    description = description =' The humiliation was too great for ';
	    for(var idx = 0; idx < outcome.humiliations.length; idx++) {
		  var nick = outcome.humiliations[idx];
		  description = (idx === 0 ? nick+' ' : description+' and '+nick );
	    }
	    description = description + ' and so they collapsed in a puddle of tears! :('; 
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
    for (var idx = 0; idx < describer.passives.length; idx++) {	
	  var passive = describer.passives[idx];
	  console.log("-- PASSIVE: "+JSON.stringify(passive))
	
	  var action = passive.action.cmd;
	  var uid = passive.userId;
	  var nick = passive.nick;
      var result = new tr.TurnResult();	
      result.addTarget(uid, nick);

	  var description = nick + ' ';
	  if (action === 'nothing') {
	    description = description + 'did nothing at all';
	  }
	  else if (action === 'cower') {
	    description = description + 'cowered for no good reason';
        if (passive.isCoward()) description = description + ' and was shamed for acting so scared again and again.';
	  }
	  else if (action === 'med') {
	    description = description + 'took her meds and recovered +2 esteem';
	    outcome.meds = outcome.meds || [];
	    result.trackPlayerMedUse(uid);
      }

	  if (passive.isHumiliated()) {
	    description = description + ' The humiliation was too great and so she collapsed in a puddle of tears! :(';
	    outcome.trackPlayerHumiliation(uid); 
	  }

      result.description = description;
	  result.esteem = passive.esteem;
	  outcome.push(result);
    };	
  },
  describeActives: function(outcome) {
    for (var idx = 0; idx < describer.actives.length; idx++) {
	  var active = describer.actives[idx];
	  var uid = active.userId;
	  var nick = active.nick;
	  var scratches = ae.getActionsByType(active.attacks, 'scratch');
	  var grabs = ae.getActionsByType(active.attacks, 'grab');
	  var teases = ae.getActionsByType(active.attacks, 'tease');
	  var cmd = active.action.cmd;
	  console.log("-- ACTIVE: "+JSON.stringify(active))
	
      var result = new tr.TurnResult();	
      result.addTarget(uid, nick);
      result.esteem = active.esteem;	
	
	  if (cmd === 'med') result.trackPlayerMedUse(uid);
	 
	  var description = nick+' was ';
	
	  function describeTeases() {
		if (teases.length < 1) return;
		
	    if (teases.length === 1) {
		  description = description + 'harmlessly teased by ' + teases[0].nick + ' ';
	    } else if (teases.length > 1) {
		  description = description + 'teased by ';
		  teases.forEach(function(tease){
		    description = description + tease.nick + ' and ';	
		  });
		  description = description + ' shamed ';
	    }		
	
		teases.forEach(function(tease){
		  result.addAttacker(tease.userId, tease.nick, 'tease');
		});	
	  };
	  function describeGrabs() {
		if (grabs.length < 1) return;
		
		var alreadyTeased = teases.length > 0;
		if (alreadyTeased) description = description + ', and ';
		
		description = description + 'grabbed by ';	
		var grabbers = []
		grabs.forEach(function(grab){
		  grabbers.push(grab.nick);
		  result.addAttacker(grab.userId, grab.nick, 'grab');
		});
		description = description + grabbers.join(' and ');

        var alreadyScratched = scratches.length > 0;
        var isMedicating = cmd === 'med';
        var isScratching = cmd === 'scratch';

		if (isMedicating && !alreadyScratched) {
		  description = description + ' and could not medicate ';
		}
		else if (isScratching) {
		  description = description + ' and could not scratch ';
		};		
	  };
	  function describeScratches() {
		if (scratches.length < 1) return;
		
		var alreadyScratchedOrGrabbed = teases.length + grabs.length > 0;
		if (alreadyScratchedOrGrabbed) description = description + ', and ';
		
		description = description + 'scratched by ';
		var scratchers = [];
		scratches.forEach(function(scratch){
		  console.log(JSON.stringify(scratch));
		  scratchers.push(scratch.nick);
		  result.addAttacker(scratch.userId, scratch.nick, 'scratch');
		});
		description = description + scratchers.join(' and ');
		
		var isCowering = cmd === 'cower';
		var isAlsoGrabbed = grabs.length > 0;
		if (isAlsoGrabbed && !isCowering) description = description + ' while grabbed ';
		
		var isMedicating = cmd === 'med';
		if (isMedicating) description = description + 'and choked trying to medicate';
		
		if (isCowering) description = description + ", but she cowered out of harm's way";
	  };	
	  function describeCowardice() {
	    if (active.isCoward()) {
		  description = description + ' and was shamed for cowering again and again.';
		}
	  };
	  function describeHumiliation() {
	    if (active.isHumiliated()) {
	      description = description + ' The humiliation was too great and so she collapsed in a puddle of tears! :(';
	      result.trackPlayerHumiliation(uid); 
	    }		
	  };

      describeTeases();
      describeGrabs();
      describeScratches();
      describeCowardice();
      describeHumiliation()

	  result.description = description;
      outcome.push(result);	
	};
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
	var action = result.action.cmd;
	
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
  describer.describeTattles(report);
  describer.describePassives(report);
  describer.describeActives(report);

  return report;
}

module.exports = {
  init: generateReport	
}