var sssn = require('./session');
var avtr = require('./avatar');
var mongoose = require('mongoose');
var graph = require('./../lib/facebook/graph');
var Schema = mongoose.Schema;

function required(val) { return val && val.length; }

var schema = new Schema({
  name: {type: String, validate: required},
  full: String,
  fbId: {type: String, index: {unique:true}},
  token: String,
  sex: String,
  ts: {type: Date, default: Date.now},
  avatar: [avtr.Schema]
});
var model = mongoose.model('User', schema);

function userParamsFromGraph(data, oAuthToken){
  var convertGraphObject = function (graphData){	
	return JSON.parse( JSON.stringify(graphData) );
  }
  var userData = convertGraphObject(data);

  var fbId = userData['id'];
  var name = userData['first_name'];
  var fullName = userData['name'];
  var gender = userData['gender'];
  var username = userData['username'];	
  var verified = userData['verified'];
  var friends = (userData['friends'] || {})['data'] || [];
  var friendIds = [];
  for (var idx = 0; idx < friends.length; idx++) {
    friendIds.push( friends[idx].id );
  }

  var params = {name: name, full: fullName, fbId: fbId, token: oAuthToken, sex: gender}	
  return params;
}

model.findOrCreateFromFacebook = function(facebookUserId, oAuthToken, fbGraphFunction, callback) {
  model.findByFbId(facebookUserId, function (err, doc){
    if (doc) {
	  callback(err, doc);
    } else if (typeof fbGraphFunction === 'function') {
	  fbGraphFunction(function(userData){
		var params = userParamsFromGraph(userData, oAuthToken)
		var user = new model(params);
	    user.save(function (err, doc) {
          callback(err, doc);
	    });
	  });
    } else {
      console.log("@@fb + ERROR in findOrCreateFromFacebook : "+err)		
	  callback(err);
    }
  })	
}

model.findByFbId = function(fbId, callback) {
  model.findOne({ fbId: fbId }, function(err, doc){	
	if (typeof callback === 'function') callback(err, doc);
  });
}

model.findBySessionId = function(sessionId, callback) {
  sssn.Model.findOne({ _id: sessionId }, function(err, doc){	
	if (doc && doc.userId) {
	  model.findById(doc.userId, callback);	
	} else {
	  if (typeof callback === 'function') callback(err, doc);
	}
  });
}

model.findById = function(id, callback) {
  model.findOne({ _id: id }, function(err, doc){	
	if (typeof callback === 'function') callback(err, doc);
  });
}

module.exports = {
  Schema: schema,
  Model: model
}