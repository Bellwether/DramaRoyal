var usr = require('./../models/user');

module.exports = {
  before_filter: function(req, res, next) {
	res.requireUser(req, res, function(isAuthorized){
	  if (isAuthorized) next();
	});
  },
	
  new: function(req, res) {
    res.render();
  },

  show: function(req, res) {
    res.render();
  },

  create: function(req, res) {	
	var name = req.body.nick;
    var userId = req.user.getId();
	
    usr.Model.findById( userId, function(err, doc){
	  var needsAvatar = doc && (doc.avatar === null || doc.avatar === undefined);
	  var canUpdateAvatar = name && needsAvatar;
	  if (canUpdateAvatar) {
		doc.avatar = {nick: name};
	    doc.save(function (err) {
	      res.redirect('/games');
	    });		
	  } else {
		console.log("could not create avatar ("+userId+", "+name+"): "+err+" "+doc+" "+doc.avatar);
		console.log("needs avatar? "+needsAvatar)
        res.redirect('/avatars/new');
	  }
	});	
  }
};