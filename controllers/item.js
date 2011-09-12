var usr = require('./../models/user').Model;
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

  index: function(req, res) {	
    itm.find({}, function(err, docs) {
      var userId = req.user.getId();
	  usr.findById(userId, function(err, doc) {
		var money = doc ? doc.money || 0 : 0;
        res.render('item/index', {items: docs, money: money});
	  })
    });
  },

  create: function(req, res){
	var itemId = req.body.id;
	
	itm.findById(itemId, function(err, doc) {
	  if (err) {	
		res.redirect('/items');
	  } else {
        var userId = req.user.getId();
	    doc.purchase(userId, function (err) {
		  console.log("purchase item ("+err+")")
		  res.redirect('/items');
	    });
	  }
	});
  }
};