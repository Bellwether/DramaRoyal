var cnfg = require('./../lib/facebook/config');
var acvmnt = require('./../models/achievement');

module.exports = {
  show: function(req, res) {	
	var achievementId = req.params.id;
	acvmnt.Model.findOne({_id: achievementId}, function(err, doc) {
      res.render('achievement/show', {layout: false, achievement: doc, appId: cnfg.AppKey});
    });
  }
};