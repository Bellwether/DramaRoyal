var sys = require('sys');
var crypto = require('crypto');
var querystring = require("querystring");

var appKey = '153494728049768';
var appSecret = 'bcc0da3c6b0c50229a1b670b690b5c46';	
var appPermissions = 'offline_access,friends_online_presence';
var callbackUrl = "https://dramaroyal.com/oauth/";
var oAuthDialogUrl = "https://www.facebook.com/dialog/oauth/"

var httpHost = 'graph.facebook.com';
var httpPort = '80';
var httpsHost = 'graph.facebook.com';
var httpsPort = '443';

var getOAuthDialogUrl = function(redirectUri, display, state) {
  redirectUri = redirectUri || callbackUrl;
  display = display || 'page';
  var params = {
    client_id: appKey,
    response_type: 'code',
    state: state,
    display: display,
    redirect_uri: redirectUri,
    scope: appPermissions
  };
  return oAuthDialogUrl + "?" + querystring.stringify(params);
}

function isWebPageRequest(req) {
  return req.accepts('html');
}

exports.init = function (app, options) {
	
  app.use( function (req, res, next){
	res.getOAuthDialogUrl = getOAuthDialogUrl;
	
    next();
  });
};