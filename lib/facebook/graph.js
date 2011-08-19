var http = require("http");
var https = require("https");
var querystring = require("querystring");

module.exports.GraphAPI = function (credentials){
  this.appKey = credentials.appKey;
  this.appSecret = credentials.appSecret;	
  this.oAuthToken = credentials.oAuthToken;

  this.httpHost = 'graph.facebook.com';
  this.httpPort = '80';
  this.httpsHost = 'graph.facebook.com';
  this.httpsPort = '443';

  function sendRequest(host, port, path, secure, method, data, parser) {
    return function(callback) {
      var protocol = http;
      if (secure) protocol = https;
      var options = {
        host: host,
        port: port,
        path: path,
        method: method || 'GET'
      };

      var request = protocol.request(options, function(response){
        response.setEncoding("utf8");
        var body = [];

        response.on("data", function (chunk) {
          body.push(chunk);
        });

        response.on("end", function () {
          callback( parser( body.join("") ));
        });
      });

      if (data != null) {
       request.write(querystring.stringify(data))
      }
      request.end();
    };
  }

  function sendRawJsonRequest(host, port, path, secure, method, data) {
   return sendRequest(host, port, path, secure, method, data, JSON.parse);
  }

  function sendRawQueryRequest(host, port, path, secure, method, data) {
   return sendRequest(host, port, path, secure, method, data, querystring.parse);
  }

  var api = {
    graphCall: function(path, params, method) {
      var host = httpHost;
      var port = httpPort;
      var secure = false;
      var data = null;
        
      var isSecureRequest = params.access_token !== undefined; // make secure if oauth token provided
      if (isSecureRequest) { 
        host = httpsHost;
        port = httpsPort;
        secure = true;
      }
       
      method = method || 'GET';
      if (method == 'POST') {
        data = params;
      } 
      else {
        path = path + '?' + querystring.stringify(params);
      }
      return graphApi.sendRawJsonRequest(host, port, path, secure, method, data);
    },
    user: function(accessToken){
	  accessToken = accessToken || this.oAuthToken;
	  var path = '/me';
	  var profileFields = 'id,name,first_name,middle_name,last_name,gender,locale,username,timezone,verified,friends';
	  var params = {fields: profileFields, access_token: accessToken};
	
	  return api.graphCall(path, params);
    },
    publish: function(postMessage, postLink, postLinkText, postLinkSubtext, postLinkDescription, postPicture) {
	  var path = '/me/feed';
	  var params = {
		message: postMessage,
		link: postLink,
		name: postLinkText,
		caption: postLinkSubtext,
		description: postLinkDescription,
		picture: postPicture,
		actions: [ { name: null, link: null } ],		
		ref: null
	  };
    },
    score: function(accessToken, score) {
	  accessToken = accessToken || this.oAuthToken;
	  var path = '/me/scores';
	  var params = {access_token: accessToken, access_token: accessToken, score: score};
	
	  return api.graphCall(path, params, 'POST');	
    }
  }	

  return api;
}