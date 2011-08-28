var ae = require('./action_effects');
var ar = require('./action_result');
var tr = require('./turn_result');

var resolutionEngine = function(game, turnIndex) {
  if (turnIndex >= game.turns.length) return;
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

  var engine = {
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
	  effects.processLickResults();
	  effects.processCowerResults();
	}
  }
  return engine;
}

var resolve = function(game, turn, callback) {
  var re = resolutionEngine(game, turn.cnt);

  re.populateEmptyActions();
  re.buildActionResults();
  re.processResults();
}

module.exports = {
  Resolve: resolve
}