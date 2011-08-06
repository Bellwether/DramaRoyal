var user = function(req){
  var request = req;
  return {
    getId: function(){ return request.session.userId; }
  }
};

exports.init = function (app) {
  app.use( function (req, res, next){
	var isWebPageRequest = req.accepts('html');
	if (isWebPageRequest) {
	  req.user = user(req);
	}
    next();
  });
};
