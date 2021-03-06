var usr = require('./../../models/user');
var fbg = require('./../../lib/facebook/graph').GraphAPI();

var user = function(req){
  var request = req;
  return {
    getId: function(){ return request.session.userId; },
    setId: function(val){ request.session.userId = val; },
    avatar: function(){ return request.session.avatar; },
    hasAvatar: function(){ return request.session.avatar !== undefined },
    setAvatar: function(val){ request.session.avatar = val; },
    hasUser: function(){ return request.session.userId !== undefined }
  }
};

function beginNewUserSession(req, res, callback){
  var token = res.facebookSession.token();
  var fbId = res.facebookSession.userId();
  var expires = res.facebookSession.tokenExpires();
  var fbGraphFunction = fbg.user(token);

  usr.Model.findOrCreateFromFacebook(fbId, token, expires, fbGraphFunction, function(err, doc) {
    console.log("AUTH beginNewUserSession findOrCreateFromFacebook "+JSON.stringify(doc))
	var hasUser = doc ? true : false;
	if (doc) {
	  req.user.setId(doc._id);
	  if (doc.avatar.nick) req.user.setAvatar(doc.avatar.nick);
	} else {
	  console.log("AUTH ERROR: could not get user from Facebook - "+ err)	
	}
	callback(hasUser);
  })
}

function isWebPageRequest(req) {
  return req.accepts('html');
}

function getUserBySession(req, res, callback) {
  var hasUser = req.user.hasUser() ? true : false;
  callback(hasUser);
}

function getUserByOauthToken(req, res, callback) {
  console.log("AUTH getUserByOauthToken for token "+res.facebookSession.token())
  if (res.facebookSession.token() === undefined) {
	callback(false);
  } else {
    beginNewUserSession(req, res, callback);
    return true;
  }	
}

function requireUser(req, res, callback, forceAuthorization) {
  if (isWebPageRequest(req)) {
	getUserBySession(req, res, function(hasUser) { 
	  console.log("AUTH getUserBySession hasUser? "+hasUser)
	  if (hasUser) {
	    callback(true);
	  } else {
		getUserByOauthToken(req, res, function(hasUser) {
		  if (hasUser) {
		    callback(true);
		  } else if (forceAuthorization !== false) {
		    res.redirect('/auths');
		  } else {
		    callback(false);
		  }
		});
	  }
	});
  } else {
	callback(true);
  }
}

function requireAvatar(req, res, callback) {
  if (isWebPageRequest(req)) {
	if ( req.user.hasAvatar() ) {
	  callback(true);
	} else {
	  res.redirect('/avatars/new');
	  callback(false);
	};
  } else {
	callback(true);
  }
}

function requireNoAvatar(req, res, callback) {
  if (isWebPageRequest(req)) {
	if ( !req.user.hasAvatar() ) {
	  callback(true);
	} else {
	  res.redirect('/games');
	  callback(false);
	};
  } else {
	callback(true);
  }
}

exports.init = function (app) {
  app.use( function (req, res, next){
	if (isWebPageRequest(req)) {
	  req.user = user(req);
	  res.requireUser = requireUser;
	  res.requireAvatar = requireAvatar;
	  res.requireNoAvatar = requireNoAvatar;
	}
	else {
	  req.user = {}; // safeguard user references for non-page requests
	}
    next();
  });
};
