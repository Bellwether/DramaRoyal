var sssn = require('./session');
var avtr = require('./avatar');
var acvment = require('./achievement');
var mongoose = require('mongoose');
var graph = require('./../lib/facebook/graph');
var Schema = mongoose.Schema;

var GRAPH_UPDATE_INTERVAL_DAYS = 7; 

function required(val) { return val && val.length; }

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(err, data);	
  }
}

var schema = new Schema({
  name: {type: String, validate: required},
  full: String,
  fbId: {type: String, index: {unique:true}},
  token: String,
  expire: Number,
  sex: String,
  ts: {type: Date, default: Date.now},
  upts: {type: Date, default: Date.now},
  avatar: {
	nick: String
  },
  money: {type: Number, default: 0},
  dramaCnt: {type: Number, default: 0},
  cn: String // country
});
var model = mongoose.model('User', schema);

function userParamsFromGraph(data, oAuthToken, tokenExpiresAt){
  var convertGraphObject = function (graphData){	
	return JSON.parse( JSON.stringify(graphData) );
  }
  var userData = convertGraphObject(data);

  if (userData['error']) {
	return {};
  }

  var fbId = userData['id'];
  var name = userData['first_name'];
  var fullName = userData['name'];
  var gender = userData['gender'];
  var username = userData['username'];	
  var verified = userData['verified'];
  var country = data['locale'].length ? data['locale'].split('_', 2)[1] : null;
  var friends = (userData['friends'] || {})['data'] || [];
  var friendIds = [];
  for (var idx = 0; idx < friends.length; idx++) {
    friendIds.push( friends[idx].id );
  }

  var params = {
	name: name, 
	full: fullName, 
	fbId: fbId, 
	token: oAuthToken, 
	expire: tokenExpiresAt, 
	sex: gender, 
	cn: country 
  };
  return params;
}

model.findOrCreateFromFacebook = function(facebookUserId, oAuthToken, tokenExpiresAt, fbGraphFunction, callback) {
  function tokenHasChanged(original, current) {
	return original !== current;
  }

  function tokenHasExpired(unixTsExpiresAt) {
	if (!unixTsExpiresAt) return false;
	
	var ONE_SECOND = 1000; // unix timestamps are seconds since epoch, not milliseconds since epoch
	var dt = new Date()
	var unixTs = Math.floor(dt.getTime() / ONE_SECOND);
	return unixTsExpiresAt < unixTs
  }

  function timeForGraphUpdate(lastUpdateAt) {
    return false;
  }
	
  function createNewUserFromFacebook(userData) {
	console.log("FACEBOOK CREATING NEW USER w/fbGraphFunction: "+JSON.stringify(userData))
	var params = userParamsFromGraph(userData, oAuthToken, tokenExpiresAt)
	var user = new model(params);
	
    user.save(function (err, doc) {
       doCallback(callback, err, doc);
    });	
  }
	
  function updateUserToken(user) {
    user.token = oAuthToken;
    user.expire = tokenExpiresAt;
    user.save(function (err, doc) {
      doCallback(callback, err, doc);
    });	
  }
	
  model.findByFbId(facebookUserId, function (err, doc){
	if (err) {
      console.log("ERROR findByFbId: "+err);
	  doCallback(callback, err);	
    } else if (doc) {
      if (tokenHasChanged(doc.token, oAuthToken)) {
        console.log("FACEBOOK FOUND USER BUT TOKEN CHANGED FROM "+doc.token+" TO "+oAuthToken)	
        updateUserToken(doc);
      } else if (tokenHasExpired(tokenExpiresAt)) {
        console.log("FACEBOOK FOUND USER BUT TOKEN EXPIRED "+tokenExpiresAt);
        doCallback(callback, "Facebook token expired");
      } else if (timeForGraphUpdate(doc.upts)) {
        console.log("FACEBOOK FOUND USER BUT TIME FOR UPDATE "+doc.upts);
        doCallback(callback, err, doc);
      } else {
        console.log("AUTH FOUND user by FB ID: "+facebookUserId)
        doCallback(callback, err, doc);
      };
    } else if (typeof fbGraphFunction === 'function') {
	  fbGraphFunction(createNewUserFromFacebook);
    } else {
      doCallback(callback, "missing fbGraphFunction() for graph API");
    }
  })	
}

model.findByFbId = function(fbId, callback) {
  model.findOne({ fbId: fbId }, function(err, doc) {
    doCallback(callback, err, doc);
  });
}

model.findBySessionId = function(sessionId, callback) {
  sssn.Model.findBySessionId(sessionId, function(err, doc){	
	var sessionValue = doc ? doc.getValue('session') : '{}';
	var userId = JSON.parse(sessionValue).userId;	

	if (userId) {
	  model.findById(userId, callback);	
	} else {	
      doCallback(callback, err);
	}
  });
}

model.findById = function(id, callback) {
  model.findOne({ _id: id }, function(err, doc) {	
    doCallback(callback, err, doc);
  });
}

model.updateNick = function(userId, name, callback) {
  model.findById(userId, function(err, doc){
    var needsAvatar = doc && (!doc.avatar || !doc.avatar.nick);
    var canUpdateAvatar = name && needsAvatar;
  
    if (canUpdateAvatar) {
	  doc.avatar = {nick: name};
      doc.save(function (err, doc) {
	    doCallback(callback, err, doc);
      });		
    } else {
	  console.log(JSON.stringify(doc));
      doCallback(callback, "Cannot update existing avatar", doc);
    }
  });	
}

model.updateBio = function(userId, bio, callback) {
  model.findById(userId, function(err, doc){
    var hasAvatar = doc && doc.avatar;
  
    if (hasAvatar) {
	  doc.avatar = {nick: doc.avatar.nick, bio: bio};
      doc.save(function (err, doc) {
	    doCallback(callback, err, doc);
      });		
    } else {
      doCallback(callback, "Avatar required for bio");
    }
  });
}

model.deauthorizeFacebook = function(fbId, callback) {
  model.findByFbId(fbId, function(err, doc) {
    if (doc) {
      doc.token = null;
      doc.expire = null;
      doc.upts = null;
      doc.save(function (err, doc) {
	    doCallback(callback, err, doc);
      });
    } else {
      doCallback(callback, "Could not find Facebook user with UID "+fbId+" "+err);
    }
  });
}

module.exports = {
  Schema: schema,
  Model: model
}