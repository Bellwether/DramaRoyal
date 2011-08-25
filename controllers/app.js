module.exports = {
  get_privacy: function(req, res){
	res.render();
  },
  get_tos: function(req, res){
	res.render();
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
  index: function(req, res){
	res.render();
  }
};