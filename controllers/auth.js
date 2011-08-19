var appKey = '153494728049768';
var canvasAppUrl = "https://apps.facebook.com/dramaroyal";
var appProfilePageUrl = 'https://www.facebook.com/apps/application.php?id='+appKey;

var facebookAuthorizeAction = function(req, res) {
  var code = req.query.code;
  var error = req.query.error;

  if (code) {
    res.redirect(canvasAppUrl);
  } 
  else {
    res.redirect(appProfilePageUrl);
  }
}

module.exports = {
  get_oauth: facebookAuthorizeAction,
  post_oauth: facebookAuthorizeAction,

  index: function(req, res) {
	var authUrl = res.getOAuthDialogUrl();
    res.render('auth/index', {layout: false, oAuthDialogUrl: authUrl});
  },

  create: facebookAuthorizeAction
};