var gt = require('./../lib/mechanics/game_tracker');

module.exports = {
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
	
	mgmt.GameManager.findGame(gameId, function(err, game){
	  if (game)	{
	    gt.Main.joinGame(gameId, userId, onJoinGame);	
	  }
	  else {	
        res.redirect('/games');
	  };
	});
  },
  create: function(req, res){
	var title = req.body.title;
	var type = req.body.type;
    var userId = req.user.getId();
	
	gt.Main.addGame(title, type, userId, function(err, game){
	  if (game)
        res.redirect('/games/'+game._id);
      else
        res.redirect('/games');
    });
  }
};