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

function receiveSignedRequest(req, appSecret){
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
    var signedData = base64.urlDecode( payload );
    jsonData = JSON.parse(signedData);

    if (jsonData.algorithm !== 'HMAC-SHA256'){ 
	  throw 'unknown algorithm used to decode signed request: ' + jsonData.algorithm;
	}
	var selfEncodedSignature = signPayload(payload);
	isValidSignature = encodedSignature === selfEncodedSignature;
	hasToken = jsonData.oauth_token !== undefined;
  } catch(err) {
    return;
  }

  if (isValidSignature && hasToken) {	
	req.facebookSession.userId(jsonData.user_id);
	req.facebookSession.token(jsonData.oauth_token);
	req.facebookSession.tokenExpires(jsonData.expires);
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
    receiveSignedRequest(req, options.secret);
    getifyFacebookPost(req);
    next();
  });
};