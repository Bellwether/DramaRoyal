var user = function(req){
  var request = req;
  return {
    getId: function(){ return request.session.userId; },
    hasAvatar: function(){ return request.session.avatar }
  }
};

function isWebPageRequest(req) {
  return req.accepts('html');
}

function requireAvatar(req, res, callback) {
  if (isWebPageRequest(req)) {
	if ( req.user.hasAvatar() ) {
	  callback(true);
	} else {
	  res.redirect('/avatars/new');
	  callback(false);
	};
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
