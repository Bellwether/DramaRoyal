function isSentByRequest(req) {
  var request_ids = req.params.request_ids;
  return (request_ids || '').length > 0;
}

module.exports = {
  get_privacy: function(req, res) {
	res.render('app/privacy');
  },

  get_tos: function(req, res) {
	res.render('app/tos');
  },

  get_health: function(req, res) {
	var os = require('os');
	var stats = {
	  freemem: os.freemem(),
	  loadavg: os.loadavg(),
	  memoryUsage: JSON.stringify(process.memoryUsage()),
	  platform: process.platform,
	  totalmem: os.totalmem()
	}
    res.render('app/health',{'stats': stats});
  },

  get_help: function(req, res) {
	res.render('app/help');
  },

  index: function(req, res){
	var sentByRequest = isSentByRequest(req);
	res.render('app/index', {'sentByRequest': sentByRequest});
  }
};