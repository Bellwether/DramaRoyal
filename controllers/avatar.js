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
	  var needsAvatar = doc && (!JSON.stringify(doc.avatar));
	  if (doc) console.log(JSON.stringify(doc.avatar)+": "+(!JSON.stringify(doc.avatar)))
	  console.log("needs avatar? "+needsAvatar)	
	  var canUpdateAvatar = name && needsAvatar;
	  if (canUpdateAvatar) {
		doc.avatar = {nick: name};
	    doc.save(function (err) {
	      res.redirect('/games');
	    });		
	  } else {
		console.log("could not create avatar ("+userId+", "+name+"): "+err+" "+doc+" "+doc.avatar);

        res.redirect('/avatars/new');
	  }
	});	
  }
};