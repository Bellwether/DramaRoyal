var ae = require('./action_effects');
var ar = require('./action_result');
var tr = require('./turn_result');
var rpt = require('./turn_report');

function resolutionEngine(game, turnIndex) {
  if (turnIndex >= game.turns.length) return {};
  var turn = game.turns[turnIndex];
  var results = {};

  function isMissingActions() {
	return turn.actions.length < game.players.length;
  }
  function getPlayerAction(uid) {
	for(var idx = 0; idx < turn.actions.length; idx++) {
	  var action = turn.actions[idx];
	  if (uid+'' === action.userId+'' ) return action;
	};	
	return null;
  }
  function isAttackingAction(action) {
    return action.targetId !== undefined;	
  }
  function playerCount() {
	return game.players.length;
  }
  function setTargetResult(action) {
	var tid = action.targetId;
    var targetPlayerResult = results[tid];

    if (targetPlayerResult) {
      targetPlayerResult.attacks.push(action); // results exist, so push action to attacks
    } else {
	  var params = {attacks: [action]};
	  results[tid] = new ActionResult(tid, null, params); // seed player results to store attacks
    }	
  }
  function setResult(uid, result) {
    results[uid] = result;	
  }
  function lastTurn() {
	if (turn.cnt > 1) return game.turns[turn.cnt - 1];
  }

  return {
	populateEmptyActions: function() {
	  if (isMissingActions()) {
		function addEmptyAction(uid) { 
		  var action = {userId: uid, cmd: 'nothing', effective: true};
		  turn.actions.push(action);
		}		
		
	    for(var idx = 0; idx < playerCount(); idx++) {
		  var uid = game.players[idx].userId;
		  var action = getPlayerAction(uid);
		
		  if (!action) addEmptyAction(uid);
		}
	  }	  
	},
	buildActionResults: function() {
	  for(var idx = 0; idx < playerCount(); idx++) {		
		var uid = game.players[idx].userId;
		var action = getPlayerAction(uid);
	    
	    var result = new ar.ActionResult(uid, action, results[uid]);
		setResult(uid, result);
	
	    if (isAttackingAction(action)) {
		  setTargetResult(action);
		}
	  }
	},
	processResults: function() {
	  var effects = ae.init(turn, results, lastTurn());
	  effects.processTattleResults();
	  effects.processGrabResults();
	  effects.processTeaseResults();
	  effects.processScratchResults();
	  effects.processMedResults();
	  effects.processCowerResults();
	},
	applyDamage: function() {
	  for(var key in results) {
	    var result = results[key];
	    var player = game.getPlayer(result.userId);
	    if (!player) continue;

	    if (result.esteem != 0) {
		  var newEsteem = player.getValue('esteem') + result.esteem;
		  player.setValue('esteem', newEsteem);
		  player.esteem = newEsteem;

		  var playerWasShamed = player.esteem < 1;
		  if (playerWasShamed) {
		    player.status = 'shamed';
		    result.trackHumiliation();
		  }
		};
	  }		
	},
    depleteResources: function() {
	  for(var userId in results) {
		var player = game.getPlayer(userId);
		var action = results[userId].action.cmd;

		// deplete player meds for model
		if (action === 'med') {
		  var newMeds = player.getValue('meds') - 1;
		  player.setValue('meds', newMeds);
		  player.meds = newMeds;
		}

		// deplete player tattles for model
		if (action === 'tattle') {
		  var newTattles = player.getValue('tattles') - 1;
		  player.setValue('tattles', newTattles);
		  player.tattles = newTattles;
		}
	  };	
    },
    report: function() {
	  return rpt.init(results);
    }
  };
}

var resolve = function(game, turn, callback) {
  var turnIndex = turn.cnt-1;
  var re = resolutionEngine(game, turnIndex);
  console.log("res engine "+re);

  re.populateEmptyActions();
  re.buildActionResults();
  re.processResults();
  re.applyDamage();
  re.depleteResources();

  var outcome = re.report();
  callback(null, outcome)
}

module.exports = {
  Resolve: resolve
}