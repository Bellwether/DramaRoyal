var cnfg = require('./../lib/facebook/config');
var acvmnt = require('./../models/achievement').Model;

module.exports = {
  show: function(req, res) {	
	var slug = req.params.id;
	
	acvmnt.findBySlug(slug, function(err, doc) {
      res.render('achievement/show', {
	    layout: false, 
	    achievement: doc, 
	    appId: cnfg.AppKey
	  });
    });
  }
};