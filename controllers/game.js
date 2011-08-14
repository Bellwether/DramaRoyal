var gt = require('./../lib/mechanics/game_tracker');

module.exports = {
  before_filter: function(req, res, next){
	next();
  },
	
  index: function(req, res){
	res.render();
  },

  new: function(req, res){
	res.render();
  },

  show: function(req, res){
	var gameId = req.params.id;
	
	function onJoinGame(err, game) {
      if (game){
        res.render('game/show',{game: game});
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