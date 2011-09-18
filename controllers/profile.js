var usr = require('./../models/user').Model;
var scr = require('./../models/score').Model;

module.exports = {
  show: function(req, res) {
	var userId = req.params.id;
	var isOwnUser = userId === 'me';
	if (isOwnUser) userId = req.user.getId();

    usr.findOne({_id: userId}, function(err, doc) {
	  if (!err && doc) {
		scr.findLastUserScore(userId, function (err, scoreDoc) {
          res.render('profile/show',{player: doc, score: scoreDoc, isOwnUser: isOwnUser});
		})
      } else {	
        res.redirect('/');
      }
    });
  }
}