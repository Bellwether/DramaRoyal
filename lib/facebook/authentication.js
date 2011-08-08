var sys = require('sys');
var crypto = require('crypto');
var querystring = require("querystring");
var fbc = require('./canvas');

var appKey = '153494728049768';
var appSecret = 'bcc0da3c6b0c50229a1b670b690b5c46';	
var appPermissions = 'offline_access,friends_online_presence';
var callbackUrl = "https://dramaroyal.com/oauth/";
var oAuthDialogUrl = "https://www.facebook.com/dialog/oauth/"

var httpHost = 'graph.facebook.com';
var httpPort = '80';
var httpsHost = 'graph.facebook.com';
var httpsPort = '443';

function isWebPageRequest(req) {
  return req.accepts('html');
}

function useFacebookSession(req) {
  req.facebookSession = {
    userId: function (val){
	  if (val) req.session.facebookUserId = val;
	  return req.session.facebookUserId;
    },
    token: function (val){
	  if (val) req.session.token = val;
	  return req.session.token;	
    },
    tokenExpires: function (val){
	  if (val) req.session.tokenExpires = val;
	  return req.session.tokenExpires;	
    }
  }	
}

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

function fbAuthHelpers(req, res, next){
  res.getOAuthDialogUrl = getOAuthDialogUrl;
  useFacebookSession(req)
  next();
}

exports.init = function (app, options) {
  app.use(fbAuthHelpers);
  fbc.init(app, {secret: appSecret});
};