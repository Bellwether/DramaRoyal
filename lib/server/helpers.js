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
	}
  });
};