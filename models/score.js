var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  userId: ObjectId,
  gameId: ObjectId,
  pop: Number,
  score: Number,
  totalOwnScores: Number,
  numOwnWins: Number,
  avgOwnScore: Number,
  totalScores: Number,
  numWins: Number,
  numWinners: Number,
  avgScore: Number,
  active: {type: Boolean, default: true},
  ts: {type: Date, default: Date.now()}
});

// schema.pre('save', function (next) {
//   var params = {'userId': this.userId, 'ts': {$lt: expiredAt}};
//     gm.update(params, {'status': 'ended'}, {multi: true}, function(err, doc) {  	
//   next();
// })

var model = mongoose.model('Score', schema);


var CUTOFF_DAYS = 30;
function getCutoffDate() {
  var cutoffAt = new Date(Date.now());
  cutoffAt.setDate(cutoffAt.getDate() - CUTOFF_DAYS);
  return cutoffAt;
}

model.getWinnerCount = function(callback) {
  return 1;	
}

model.getBayesianScore = function(avgWins, avgScore, wins, score) {
  return ((avgWins * avgScore) + (wins * score)) / (avgWins + wins);
}

model.setPopularity = function(params) {
  var score = params.score;
  var wins = params.numOwnWins;
  var avgScore = params.totalScores / params.numWins;
  var avgWins = params.wins / params.winners;

  params.pop = model.getBayesianScore(avgWins, avgScore, wins, score);
}

model.findHighScores = function(callback) {
  var cutoffAt = getCutoffDate();
  var params = {'ts': {$gt: cutoffAt}};

  	
}

model.findFirsts = function(userId, callback) {
  var query = model.findOne().sort('ts', 1);
  query.exec(function(err, globalScore) {
	query = model.findOne({userId: userId}).sort('ts', 1);
	query.exec(function(err, userScore) {
      callback(err, globalScore, userScore);
    });
  });
}

model.prototype.createScore = function(gameId, player, callback) {
  var esteem = player.esteem;
  if (esteem < 1) {
    callback("Cannot score with no esteem");
    return;
  }

  var userId = player.userId;
  model.findFirsts(function (err, globalDoc, userDoc) {
	if (!err) {
	  var params = {userId: userId, gameId: gameId, score: esteem};
	  if (globalDoc) {		
		prams.totalOwnScores = userDoc ? userDoc.totalOwnScores+params.score : params.score;
		prams.numOwnWins = userDoc ? userDoc.numOwnWins+1 : 1;
		prams.avgOwnScore = params.totalOwnScores / prams.numOwnWins;
		prams.totalScores = globalDoc.totalScores+params.score;
		prams.numWins = globalDoc.numWins+1;
		prams.numWinners = model.getWinnerCount();
		prams.avgScore = prams.totalScores / prams.numWins;
	  } else {
		prams.totalOwnScores = 1;
		prams.numOwnWins = 1;
		prams.avgOwnScore = params.score;
		prams.totalScores = params.score;
		prams.numWins = 1;
		prams.numWinners = 1;
		prams.avgScore = params.score;
	  }
	  model.setPopularity(params);
	
	  score = new model(params);
	  score.save(function (err, doc) {
		callback(err, doc);
	  });
	} else {
	  callback(err);
	}
  });
}

// br = ( (avg_num_votes * avg_rating) + (this_num_votes * this_rating) ) / (avg_num_votes + this_num_votes)
// 
// Legend:
// 
// avg_num_votes: The average number of votes of all items that have num_votes>0 
// avg_rating: The average rating of each item (again, of those that have num_votes>0) 
// this_num_votes: number of votes for this item 
// this_rating: the rating of this item 
// 
// Note: avg_num_votes is used as the “magic” weight in this formula. The higher this value, the more votes it takes to influence the bayesian rating value.


// avg number of wins
// avg health of wins (for wins > 0)
// this number of wins
// this win health


// need to store:
// personal score for current game
// personal average score
// global average scores
// if score is current high score average

module.exports = {
  Schema: schema,
  Model: model
}