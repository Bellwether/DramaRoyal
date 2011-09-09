var http = require("http");
var https = require("https");
var querystring = require("querystring");
var cnfg = require('./config');

module.exports.GraphAPI = function (){
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
          if (typeof callback === 'function') {
	        var responseData = parser(body.join(''));
	        callback(responseData);
	      };
        });
      });

      if (data != null) {
	   console.log("sendRequest: "+querystring.stringify(data))
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
    httpHost: 'graph.facebook.com',
    httpPort: '80',
    httpsHost: 'graph.facebook.com',
    httpsPort: '443',
    graphCall: function(path, params, method) {
      var host = api.httpHost;
      var port = api.httpPort;
      var secure = false;
      var data = null;
        
      var isSecureRequest = params.access_token !== undefined; // make secure if oauth token provided
      if (isSecureRequest) { 
        host = api.httpsHost;
        port = api.httpsPort;
        secure = true;
      }
       
      method = method || 'GET';
      if (method == 'POST') {
        data = params;
      } 
      else {
        path = path + '?' + querystring.stringify(params);
      }
      return sendRawJsonRequest(host, port, path, secure, method, data);
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
    score: function(userId, score) {
	  var token = cnfg.AppAccessToken;
	  var secret = cnfg.AppSecret;
	  var path = '/'+userId+'/scores';
	  var params = {access_token: token, score: score+''};
	  // var params = {api_key: cnfg.AppKey, score: score+''};	
	console.log("trying to score "+path+" with "+JSON.stringify(params))
	
	  return api.graphCall(path, params, 'POST');	
    }
  }	

  return api;
}