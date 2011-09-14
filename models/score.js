var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CUTOFF_DAYS = 7;

var schema = new Schema({
  userId: {type: ObjectId, index: true},
  gameId: ObjectId,
  nick: String,
  pop: Number,
  score: Number,
  totalOwnScores: Number,
  numOwnWins: Number,
  avgOwnScore: Number,
  totalScores: Number,
  numWins: Number,
  numWinners: Number,
  avgScore: Number,
  active: {type: Boolean, default: true, index: true},
  ts: {type: Date, default: Date.now(), index: true}
});

schema.pre('save', function (next) {
  // deactivate old score (if any) for user
  var params = {'userId': this.userId};
  model.update(params, {'active': false}, {multi: true}, function(err, doc) {  	
    next();
  });
})

var model = mongoose.model('Score', schema);

function getCutoffDate() {
  var cutoffAt = new Date(Date.now());
  cutoffAt.setDate(cutoffAt.getDate() - CUTOFF_DAYS);
  return cutoffAt;
}

function parameterizeScore(params, userDoc, callback) {
  model.getScoreSumAndWinCount(function (err, totalScores, numWins) {	
	totalScores = totalScores ? totalScores : 0;
	numWins = numWins ? numWins : 1;
	params.totalOwnScores = userDoc ? userDoc.totalOwnScores+params.score : params.score;
	params.numOwnWins = userDoc ? userDoc.numOwnWins+1 : 1;
	params.avgOwnScore = params.totalOwnScores / params.numOwnWins;
	params.totalScores = totalScores+params.score;
	
	model.getWinnerCount(function (err, winnerCount) {
	  if (!err) {
	    params.numWins = numWins;
	    params.numWinners = winnerCount ? winnerCount+1 : 1;
	
	    params.avgScore = params.totalScores / params.numWins;
	    model.setPopularity(params);
	    callback(err, params);
	  } else {
	    callback(err, params);
	  }
	});
  });	
}

model.getScoreSumAndWinCount = function(callback) {
  function scoreMap() { 
	emit('totalScore', this.score); 
  } 

  function scoreReduce(previous, scores) { 
	var count = 0; 
    for (var i in scores) {
      count += scores[i];
    }
	return count; 
  }; 

  function mapReduceScore(err, result) {
	if (err) {
	  callback(err);
	} else {
	  console.log("mapreducescore: "+JSON.stringify(result))
	  var doc = result["documents"][0];
	  var sum = doc["results"][0] ? doc["results"][0].value : 0;
	  var winCount = doc["counts"] ? doc["counts"].input : 0;
	
	  callback(err, sum, winCount);
	}
  }
	
  var cutoffAt = getCutoffDate();
  var command = { 
    mapreduce: "scores",
    map: scoreMap.toString(),
    reduce: scoreReduce.toString(),
    query: {'ts': {$gt: cutoffAt}},
    out: {inline : 1}
  };
	
  mongoose.connection.db.executeDbCommand(command, mapReduceScore);
}

model.getWinnerCount = function(callback) {
  var cutoffAt = getCutoffDate();
  var params = {'active': true, 'ts': {$gt: cutoffAt}};

  var query = model.count(params, function(err, num){
    callback(err, num)
  });
}

model.getBayesianScore = function(avgWins, avgScore, wins, score) {
  return ((avgWins * avgScore) + (wins * score)) / (avgWins + wins);

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


}

model.setPopularity = function(params) {
  var score = params.score;
  var wins = params.numOwnWins;
  var avgScore = params.totalScores / params.numWins;
  var avgWins = params.numWins / params.numWinners;

  params.pop = model.getBayesianScore(avgWins, avgScore, wins, score);
}

model.findHighScores = function(callback) {
  var cutoffAt = getCutoffDate();
  var params = {'active': true, 'ts': {$gt: cutoffAt}};

  var query = model.find(params).sort('pop', -1).limit(25);
  query.exec(function(err, docs) {
	callback(err, docs);
  })
}

model.findLastUserScore = function(userId, callback) {
  var params = {'userId': userId, 'active': true};
  model.findOne(params, function(err, doc) {
    callback(err, doc);
  });
}

model.findLastUserScores = function(userIds, callback) {
  var params = {'userId': {'$in': userIds}, 'active': true};
  model.find(params, function(err, docs) {
    callback(err, docs);
  });
}

model.createScore = function(gameId, player, callback) {
  var esteem = player.esteem;
  if (esteem < 1) {
    callback("Cannot score with no esteem");
    return;
  }

  var userId = player.userId;
  var nick = player.nick

  function onLastUserScore(err, userDoc) {
	if (!err) {
	  var params = {'userId': userId, 'gameId': gameId, 'score': esteem, 'nick': nick};
	  parameterizeScore(params, userDoc, function(err, scheme) {
	    score = new model(scheme);
	    score.save(function (err, scoreDoc) {
		  console.log("tried saving user score: "+err+" "+JSON.stringify(scoreDoc))
		  callback(err, scoreDoc);
        });
	  });	
	} else {
	  callback(err);
	}
  }

  model.findLastUserScore(userId, onLastUserScore);
}

module.exports = {
  Schema: schema,
  Model: model
}