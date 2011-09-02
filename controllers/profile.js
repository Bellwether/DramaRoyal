var usr = require('./../models/user');
var gm = require('./../models/game');

module.exports = {
  show: function(req, res) {
	var playerId = req.params.id;
	if (playerId === 'me') playerId = req.user.getId();
	
    usr.Model.findOne({_id: playerId}, function(err, doc) {
	  if (!err && doc) {
        res.render('profile/show',{player: doc});
      } else {	
        res.redirect('/');
      }
    });
  }
}