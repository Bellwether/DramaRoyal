var gt = require('./../lib/mechanics/game_tracker');

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
	res.render();
  },

  new: function(req, res){
	res.render();
  },

  show: function(req, res){
	var gameId = req.params.id;
    var userId = req.user.getId();
	
	function onJoinGame(err, game) {
      if (game){
        res.render('game/show',{game: game, userId: userId});
      } else {
        res.redirect('/games');
      };
	}
	
	gt.Main.joinGame(gameId, userId, onJoinGame);
  },

  create: function(req, res){
	var title = req.body.title;
	var type = req.body.type;
    var userId = req.user.getId();
	
	gt.Main.createGame(title, type, userId, function(err, game){
	  if (game) {
        res.redirect('/games/'+game._id);
      } else {
	    console.log("error creating game "+err);
        res.redirect('/games');
      }
    });
  }
};