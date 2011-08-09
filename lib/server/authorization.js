var usr = require('./../../models/user').Model;

var user = function(req){
  var request = req;
  return {
    getId: function(){ return request.session.userId; },
    hasAvatar: function(){ return request.session.avatar !== undefined },
    hasUser: function(){ return request.session.userId !== undefined }
  }
};

function beginNewUserSession(req, callback){
  usr.User.findFromFbId( facebookUserId, function(err, doc){	
	callback();
  })
}

function isWebPageRequest(req) {
  return req.accepts('html');
}

function getUserBySession(req, callback) {
  var hasUser = req.user.hasUser() ? true : false;
  callback(hasUser);
}

function getUserByOauthToken(req, callback) {
  if (req.facebookSession.userId === undefined) {
	callback(false);
  } else {
    beginNewUserSession(req, callback);
    return true;
  }	
}

function requireUser(req, res, callback) {
  if (isWebPageRequest(req)) {
	getUserBySession(req, function(hasUser){ 
	  if (hasUser) {
	    callback(true);
	  } else {
		getUserByOauthToken(req, callback)
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

exports.init = function (app) {
  app.use( function (req, res, next){
	if (isWebPageRequest(req)) {
	  req.user = user(req);
	}
    next();
  });
};
