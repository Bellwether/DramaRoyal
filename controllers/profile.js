var usr = require('./../models/user').Model;
var scr = require('./../models/score').Model;

module.exports = {
  index: function(req, res) {
	res.render('profile/index');
  },

  show: function(req, res) {
	var userId = req.params.id;

    usr.findOne({_id: userId}, function(err, doc) {
	  if (!err && doc) {
		scr.findLastUserScore(userId, function (err, scoreDoc) {
          res.render('profile/show', {'layout': false, 'player': doc, 'score': scoreDoc});
		})
      } else {	
        res.redirect('/');
      }
    });
  },

  edit: function(req, res) {	
	var userId = req.user.getId();
    usr.findOne({_id: userId}, function(err, doc) {
	  if (!err && doc) {
		scr.findLastUserScore(userId, function (err, scoreDoc) {
          res.render('profile/edit', {'player': doc, 'score': scoreDoc});
		})
      } else {	
        res.redirect('/');
      }
    });	
  }
}