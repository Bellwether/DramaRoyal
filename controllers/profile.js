var usr = require('./../models/user');
var gm = require('./../models/game');
var scr = require('./../models/score').Model;

module.exports = {
  show: function(req, res) {
	var userId = req.params.id;
	if (userId === 'me') userId = req.user.getId();
	
    usr.Model.findOne({_id: userId}, function(err, doc) {
	  if (!err && doc) {
		scr.findLastUserScore(userId, function (err, scoreDoc) {
          res.render('profile/show',{player: doc, score: scoreDoc});
		})
      } else {	
        res.redirect('/');
      }
    });
  }
}