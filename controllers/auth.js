module.exports = {
  get_authorize: function(req, res) {
	var authUrl = res.getOAuthDialogUrl();
    res.render('app/authorize', { layout: false, oAuthDialogUrl: authUrl});
  },

  get_callback: function(req, res) {
  }
};