var sys = require('sys');
var querystring = require("querystring");
var fbc = require('./canvas');
var cnfg = require('./config');

var appKey = '153494728049768';
var appSecret = 'bcc0da3c6b0c50229a1b670b690b5c46';	
var appPermissions = 'offline_access,publish_actions';
var callbackUrl = "https://dramaroyal.com/auths/oauth";
var oAuthDialogUrl = "https://www.facebook.com/dialog/oauth/"

function isWebPageRequest(req) {
  return req.accepts('html');
}

var facebookSession = function(req) {
  var request = req;
  return {
    userId: function (val){
	  if (val) request.session.facebookUserId = val;
	  return request.session.facebookUserId;
    },
    token: function (val){
	  if (val) request.session.token = val;
	  return request.session.token;	
    },
    tokenExpires: function (val){
	  if (val) request.session.tokenExpires = val;
	  return request.session.tokenExpires;	
    }
  }	
}

var getOAuthDialogUrl = function(redirectUri, display, state) {
  redirectUri = redirectUri || callbackUrl;
  display = display || 'page';
  var params = {
    client_id: cnfg.AppKey,
    response_type: 'code',
    state: state,
    display: display,
    redirect_uri: redirectUri,
    scope: appPermissions
  };
  return oAuthDialogUrl + "?" + querystring.stringify(params);
}

function fbAuthHelpers(req, res, next){
  res.getOAuthDialogUrl = getOAuthDialogUrl;
  res.facebookSession = facebookSession(req)
  next();
}

exports.init = function (app, options) {
  app.use(fbAuthHelpers);
  fbc.init(app, {secret: appSecret});
};