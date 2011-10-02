var http = require("http");

var Timeline = (function(){
  this.api_url = "api.twitter.com";
  this.client = http.createClient(80, this.api_url);  
  this.timeline_url = "/1/statuses/user_timeline/dramaroyal.json?";
  this.latestTweetId = 1;
  this.tweets = [];
  this.lastPolledAt = null;
  this.pollingInterval = 30;
  this.maxTweets = 10;

  function utcTimestamp() {
	var now = new Date(); 
	return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), 0);	
  }

  function isDNSError(e) {
	return e.message.indexOf("ECONNREFUSED") >= 0;
  }

  var self = this;
  return {
	needsPolling: function() {
	  if (self.lastPolledAt === null) return true;
	
	  var ts = utcTimestamp();
      var ms = ts.getTime() - self.lastPolledAt.getTime();
      var diffInMinutes = parseInt(ms / 1000 / 60);
      return diffInMinutes >= pollingInterval;
	},
	pollTweets: function(callback) {
	  var query = "since_id="+self.latestTweetId+"&count="+self.maxTweets+"&trim_user=1&include_rts=0"
	  var conn = http.createClient(80, self.api_url); 
	
	  conn.addListener('error', function(e) {
	    if (isDNSError(e)) {
		  callback("ECONNREFUSED, Could not contact DNS servers");
	    } else {
		  throw e;
	    }
	  });

      var that = this;
	  var req = conn.request("GET", self.timeline_url+query, {"host": self.api_url});
	  req.addListener('response', function(res) {
	    var body = '';
	    res.addListener('data', function(chunk) { 
	      body += chunk; 
	    });
	    res.addListener('end', function() {
          that.setTweets(body);
          that.setLatestTweet();
          that.setTimestamp();
          callback(null, self.tweets);
	    });
	  });

	  req.end();
	},
	setTimestamp: function() {
	  self.lastPolledAt = utcTimestamp();
	},
    tweets: self.tweets,
    setTweets: function(data) {
	  var t = JSON.parse(data);

	  if (t.length) {
		t.reverse(); // add oldest first
		this.tweets.splice(0, [self.maxTweets,t.length]);
		while (this.tweets.length < self.maxTweets) {
		  this.tweets.push(t.pop());
		}
	  }
    },
    latestTweet: 1,
    setLatestTweet: function() {
	  self.latestTweetId = (self.tweets.length > 0) ? self.tweets[0].id_str : 1;
    },
    getTweets: function(callback) {
	  if (this.needsPolling()) {
	    this.pollTweets(callback)	
	  } else {
	    callback(null, self.tweets)	;
	  }
    }
  };
})();

module.exports = Timeline;