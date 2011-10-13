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
	
  index: function(req, res) {	
    var userId = req.user.getId();

    gt.Main.findGames(function (err, docs) {
      res.render('game/index',{ games: docs, userId: userId });
    })
  },

  new: function(req, res){
	res.render();
  },

  show: function(req, res){
	var gameId = req.params.id;
    var userId = req.user.getId();
    var nick = req.user.avatar();
	
	function onJoinGame(err, game) {
      if (game) {
        res.render('game/show',{game: game, userId: userId});
      } else {
        res.redirect('/games');
      };
	}
	
	gt.Main.joinGame(gameId, userId, nick, onJoinGame);
  },

  create: function(req, res){
	var title = req.body.title;
	var type = req.body.type;
	var pace = req.body.pace;
    var userId = req.user.getId();
    var nick = req.user.avatar();

    function onCreateGame(err, gameOrId) {
	  if (err) {
		console.log("error creating game "+err);
		var url = (gameOrId) ? '/games/'+gameOrId : '/games';
	    res.redirect(url);
      } else {		
        res.redirect('/games/'+gameOrId._id);
      }
    }
	
	gt.Main.createGame(title, type, pace, userId, nick, onCreateGame);
  },

  destroy: function(req, res){	
	var gameId = req.params.id;
    var userId = req.user.getId();

    function onQuitGame(err, game) {
      res.redirect('/games');
    }
	
	gt.Main.quitGame(gameId, userId, onQuitGame);
  }
};