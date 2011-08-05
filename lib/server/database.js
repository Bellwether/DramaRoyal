var mongoose = require('mongoose');

var expiredSessionTimeout = 1200;
var config = {
  db: 'dramaroyal',
  clear_interval: expiredSessionTimeout
};

exports.init = function (app) {
  app.configure('development', function(){
    config.db = 'dramaroyal';
    config.host = 'localhost';
    config.port = 27017;
  });
  app.configure('production', function(){
    config.db = 'dramaroyal';
    config.host = 'localhost';
    config.port = 27017;
  });
  config.url = 'mongodb://'+config.host+':'+config.port+'/'+config.db;

  mongoose.connect(config.url, function(err) {
    if (err) {
	  console.log("error connecting to database at "+config.url+" - "+JSON.stringify(err));
	  throw err;
	} else {
	  console.log("connected to database at "+config.url);
	}
  });

  exports.config = config;
};

