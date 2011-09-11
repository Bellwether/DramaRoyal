var itm = require('./../models/item').Model;

module.exports = {
  before_filter: function(req, res, next){
	res.requireUser(req, res, function(isAuthorized){
	  if (isAuthorized) {
		res.requireAvatar(req, res, function(hasAvatar){
		  if (hasAvatar) next();
		});
	  }
	});
  },

  index: function(req, res){
    itm.find({}, function(err, docs){
      res.render('item/index', {items: docs});
    });
  },

  create: function(req, res){
	var itemId = req.body.id;
  }
};