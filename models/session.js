var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  _id: { type: String, index: true},	
  userId: String,
  facebookUserId: String,
  token: String,
  tokenExpires: Number
});
var model = mongoose.model('Session', schema);

module.exports = {
  Schema: schema,
  Model: model
}

model.findBySessionId = function(sessionId, callback) {
  model.findById(sessionId, function(err, doc){
	callback(err, doc)
  });
}