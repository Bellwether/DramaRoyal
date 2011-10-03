var cnfg = require('./../lib/facebook/config');

var facebookDeauthorizeAction = function(req, res) {
  console.log("@@fb FACEBOOK DEAUTH "+req.params);
  console.log("@@fb FACEBOOK DEAUTH "+req.query);
}

var facebookAuthorizeAction = function(req, res) {
  var code = req.query.code;
  var error = req.query.error;

  if (code) {
	console.log("@@fb FACEBOOK AUTHORIZATION APPROVED WITH CODE ++++++++++++ !")
    res.redirect(cnfg.CanvasAppUrl);
  } 
  else {
	console.log("@@fb FACEBOOK AUTHORIZATION REFUSED -------------- ! "+error)
    res.redirect(cnfg.AppProfilePageUrl);
  }
}

module.exports = {
  get_oauth: facebookAuthorizeAction,
  post_oauth: facebookAuthorizeAction,
  get_deoauth: facebookDeauthorizeAction,
  post_deoauth: facebookDeauthorizeAction,

  index: function(req, res) {
	var authUrl = res.getOAuthDialogUrl();
    res.render('auth/index', {layout: false, oAuthDialogUrl: authUrl});
  },

  create: facebookAuthorizeAction
};