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
	  return req.session.game !== undefined;
    },
    avatarNick: function(req){
	  return req.user.avatar();
    },
    hasAvatar: function(req){
	  return req.user && req.user.hasAvatar();
    },
	sessionId: function(req) {
	  return req.session.id;	
	}
  });
};