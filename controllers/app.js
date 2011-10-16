var fbg = require('./../lib/facebook/graph').GraphAPI();
var twtr = require('./../lib/twitter/timeline');

function getRequestIds(req) {
  return (req.query && req.query.request_ids) || 
         (req.body && req.body.request_ids);
}

function clearFBRequests(req, res) {
  var fbId = res.facebookSession.userId();
  if (!fbId) return;

  var request_ids = getRequestIds(req).split(',');
  for (var idx = 0; idx < request_ids.length; idx++) {
    var rid = request_ids[idx];
    var graphClearFunction = fbg.clearRequest(fbId, rid)();
  }
}

function isSentByFBRequest(req) {
  return (getRequestIds(req) || '').length > 0;
}

function checkAuthorization(req, res, callback) {
  // authorize user if token exists, but don't force redirect
  res.requireUser(req, res, callback, false);
}

var facebookIndexAction = function(req, res) {
  // all facebook user requests link back to the root canvas page, so handle those here
  var sentByRequest = isSentByFBRequest(req);
  if (sentByRequest) clearFBRequests(req, res);

  checkAuthorization(req, res, function() {
    twtr.getTweets(function(err, tweets) {
	  res.render('app/index', {'sentByRequest': sentByRequest, 'tweets': tweets || []});
    })
  }, false);
}


module.exports = {
  get_presence	: function(req, res) {
	res.render('app/presence');
  },
	
  get_privacy: function(req, res) {
	res.render('app/privacy');
  },

  get_tos: function(req, res) {
	res.render('app/tos');
  },

  get_health: function(req, res) {
	var os = require('os');
	var stats = {
	  freemem: os.freemem(),
	  loadavg: os.loadavg(),
	  memoryUsage: JSON.stringify(process.memoryUsage()),
	  platform: process.platform,
	  totalmem: os.totalmem()
	}
    res.render('app/health',{'stats': stats});
  },

  get_help: function(req, res) {
	res.render('app/help', {layout: false});
  },

  index: facebookIndexAction,
  create: facebookIndexAction // handles Facebook POST, which acts as GET on CANVAS iframes
};