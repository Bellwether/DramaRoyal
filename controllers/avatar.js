var usr = require('./../models/user').Model;

module.exports = {
  before_filter: function(req, res, next) {
	res.requireUser(req, res, function(isAuthorized){
	  console.log("AUTH requireUser isAuthorized? "+isAuthorized)
	  if (isAuthorized) next();
	});
  },
	
  new: function(req, res) {
	res.requireNoAvatar(req, res, function(hasNoAvatar){
	  console.log("AUTH requireNoAvatar hasNoAvatar? "+hasNoAvatar)
	  if (hasNoAvatar) res.render();
	});
  },

  show: function(req, res) {	
    var userId = req.user.getId();

	res.render();
  },

  create: function(req, res) {	
	var name = req.body.nick;
    var userId = req.user.getId();
	
    usr.updateNick(userId, name, function(err, doc) {
	  if (err) {	
		req.user.setAvatar(name);
	    res.redirect('/games');
	  } else {
		console.log("AUTH could not create avatar ("+userId+", "+name+"): "+err);
		res.redirect('/avatars/new');
	  }
	});	
  }
};