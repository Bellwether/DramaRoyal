var crypto = require('crypto');

var base64 = {
  encode: function (unencoded) {
    return new Buffer(unencoded || '').toString('base64');
  },
  decode: function (encoded) {
    return new Buffer(encoded || '', 'base64').toString('utf8');
  },
  urlDecode: function(encoded) {
    var encoded = (encoded || '').replace('-','+').replace('_','/');
    for (var idx = 0; idx < (4 - (encoded.length % 4)); idx++) encoded = encoded + '=';
    return base64.decode(encoded);
  }
};

function signPayload(payload, appSecret) {
  var data = crypto.createHmac('sha256', appSecret).update(payload).digest('base64');
  return data.replace(/\+/g,'-').replace(/\//g,'_').replace('=','');
}

function receiveSignedRequest(req, res, appSecret){
  // heather
  // localhost:3000/games?signed_request=QX9HRHrX7HO1VDSUfhOsfoZKxPY6vgm2nNqlUDxn2E0.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjAsImlzc3VlZF9hdCI6MTMxNjk1NzMxNiwib2F1dGhfdG9rZW4iOiJBQUFDTG1rYTloR2dCQU05OFBmS3IwT1ZpRmJLMXlOWWlSQllSbkE4eGQxRm9aQnI3dGZiRmV6TGllakVtcVNhR1BzeGg3T3BYUk0xenpxZGVtcGRnbWFPTDYya0dLVHpWVndmcHoxd1pEWkQiLCJ1c2VyIjp7ImNvdW50cnkiOiJubCIsImxvY2FsZSI6ImVuX1VTIiwiYWdlIjp7Im1pbiI6MjF9fSwidXNlcl9pZCI6IjEwMDAwMjcwNTc0OTkyNCJ9
  // sophia
  // localhost:3000/games?signed_request=7r_DH6RAlu--IG_6iwIVP5hDdTTmWc-IA_4-MwV-9PU.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjAsImlzc3VlZF9hdCI6MTMxNjk1NzUyMiwib2F1dGhfdG9rZW4iOiJBQUFDTG1rYTloR2dCQVAyVmxCNVl3dUxLdTFieWpaQnczMkRrSGRjRXphWXQ1dlhSVUlzU3RMYVRFdExZQ1V3N2RETzljQXQwcXlpek1hY0dWZzYyeExHOGR1bEpRMXdaQTJTWFEzd3daRFpEIiwidXNlciI6eyJjb3VudHJ5IjoibmwiLCJsb2NhbGUiOiJlbl9VUyIsImFnZSI6eyJtaW4iOjIxfX0sInVzZXJfaWQiOiIxMDAwMDI3NDY3MzAwMDgifQ
  // vag
  // localhost:3000/games?signed_request=nlYCWGhLz1U-kNjI5wmSJN5EX8OTjv9CMRmxqxnmeKE.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjAsImlzc3VlZF9hdCI6MTMxNjk1NzcwMywib2F1dGhfdG9rZW4iOiJBQUFDTG1rYTloR2dCQUlhR1hudXpaQm1TMlpDWkJYbHBaQnByTkVGTHJIOGN3SkoxdERxTFRMQmZYVW1WemNKZEt4eE81azVaQWJHaTFyNGp4UU1ucURxejVyU2pvbWI4WkQiLCJ1c2VyIjp7ImNvdW50cnkiOiJubCIsImxvY2FsZSI6ImVuX1VTIiwiYWdlIjp7Im1pbiI6MjF9fSwidXNlcl9pZCI6IjYwODMwMjM0NyJ9



  if (!isCanvasRequest(req)) return;

  var params = req.method === 'POST' ? req.body : req.query;
  var signedRequest = params.signed_request;
  var signatureParts = signedRequest.split('.', 2);
  var encodedSignature = signatureParts[0];
  var payload = signatureParts[1];

  var jsonData = {};
  var isValidSignature = false;
  var hasToken = false;

  try {
    var signedData = base64.urlDecode(payload);
    jsonData = JSON.parse(signedData);

    if (jsonData.algorithm !== 'HMAC-SHA256') { 
	  throw 'unknown algorithm used to decode signed request: ' + jsonData.algorithm;
	}
	var selfEncodedSignature = signPayload(payload, appSecret);
	isValidSignature = encodedSignature === selfEncodedSignature;
	hasToken = jsonData.oauth_token !== undefined;
  } catch(err) {
    console.log("ERROR FACEBOOK receiveSignedRequest: "+err)
    return;
  }

  if (isValidSignature && hasToken) {
	console.log("FACEBOOK receiveSignedRequest: "+JSON.stringify(jsonData))
	res.facebookSession.userId(jsonData.user_id);
	res.facebookSession.token(jsonData.oauth_token);
	res.facebookSession.tokenExpires(jsonData.expires);
  } else if (isValidSignature) {
	console.log("FACEBOOK MISSING TOKEN receiveSignedRequest: "+JSON.stringify(jsonData))
  } else {
	console.log("ERROR FACEBOOK INVALID receiveSignedRequest: "+JSON.stringify(jsonData))
  }
}

function isCanvasRequest(req) {
  var p = (req.body || req.query || {});
  var signedRequest = p['signed_request'];
  return signedRequest !== undefined && signedRequest.length > 0;
}

function getifyFacebookPost(req) {
  var isPost = req.method === 'POST';

  if ( isCanvasRequest(req) && isPost ) {
	req.method = 'GET';
  };
}

function useHelpers(req, res) {
  res.isCanvasRequest = isCanvasRequest;
}

exports.init = function (app, options) {
  app.use(function (req, res, next){
    useHelpers(req, res);
    receiveSignedRequest(req, res, options.secret);
    getifyFacebookPost(req);
    next();
  });
};