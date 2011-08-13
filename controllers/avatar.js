var usr = require('./../models/user');

module.exports = {
  before_filter: function(req, res, next){
	next();
  },
	
  new: function(req, res){
    res.render();
  },

  show: function(req, res){
    res.render();
  }
};