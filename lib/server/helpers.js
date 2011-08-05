exports.init = function(app){
  var env = 'development';
  app.configure('production', function () {
	env = 'production';
  });	
	
  app.dynamicHelpers({
	environment: function(req) {
	  return env;	
	},
	isProductionEnv: function(req) {
	  return env === 'production';
	},
    isPlaying: function(req){
	  return req.session.game != undefined;
    },
    hasAvatar: function(req){
	  return req.session.avatar != undefined;
    },
	sessionId: function(req) {
	  return req.session.id;	
	},
  });
};