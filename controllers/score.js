var scr = require('./../models/score').Model;

module.exports = {
  index: function(req, res) {
    scr.findHighScores(function(err, docs) {
	  if (!err && docs) {
        res.render('score/index',{scores: docs});
      } else {	
        res.redirect('/');
      }
    });
  }
}