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
  req.query.signed_request='eA3joe9mvMWWAkzKN0gFSNl5lKezHhlOqEgDGDUZLJg.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjAsImlzc3VlZF9hdCI6MTMxMzc5MTMxNywib2F1dGhfdG9rZW4iOiIxNTM0OTQ3MjgwNDk3Njh8ZTAzZGVhZmFmYTNmNDQzNWM0OGNiZDJjLjEtMTAwMDAyNzA1NzQ5OTI0fEZfZnpFR2dSemJ3M0lzalloX2lBbG5EeGhtTSIsInVzZXIiOnsiY291bnRyeSI6Im5sIiwibG9jYWxlIjoiZW5fVVMiLCJhZ2UiOnsibWluIjoyMX19LCJ1c2VyX2lkIjoiMTAwMDAyNzA1NzQ5OTI0In0';	
  if (!isCanvasRequest(req)) return;



  var params = req.method === 'POST' ? req.body : req.query;	
  var signedRequest = params.signed_request;
  var signatureParts = signedRequest.split('.', 2);
  var encodedSignature = signatureParts[0];
  var payload = signatureParts[1];

  var jsonData = {};
  var isValidSignature = false;
  var hasToken = false;

  console.log("@@fb - receiveSignedRequest: "+params.signed_request)

  try {
    var signedData = base64.urlDecode(payload);
    jsonData = JSON.parse(signedData);
    console.log("@@fb - got JSON data: "+JSON.stringify(jsonData));

    if (jsonData.algorithm !== 'HMAC-SHA256') { 
	  throw 'unknown algorithm used to decode signed request: ' + jsonData.algorithm;
	}
	var selfEncodedSignature = signPayload(payload, appSecret);
	isValidSignature = encodedSignature === selfEncodedSignature;
	hasToken = jsonData.oauth_token !== undefined;
  } catch(err) {
    console.log("@@fb - ERROR in receiveSignedRequest: "+err)
    return;
  }

  if (isValidSignature && hasToken) {	
	res.facebookSession.userId(jsonData.user_id);
	res.facebookSession.token(jsonData.oauth_token);
	res.facebookSession.tokenExpires(jsonData.expires);
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

function useHelpers(req, res){
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