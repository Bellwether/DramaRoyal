var avtr = require('./avatar');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function required(val) { return val && val.length; }

var schema = new Schema({
  name: {type: String, validate: required},
  full: String,
  fbId: {type: String, index: {unique:true} },
  token: String,
  sex: String,
  ts: { type: Date, default: Date.now },
  avatar: [avtr.Schema]
});
var model = mongoose.model('User', schema);

model.findByFbId = function(fbId, callback) {
  model.findOne({ fbId: fbId }, function(err, doc){	
	if (typeof callback === 'function') callback(err, doc);
  });
}

model.findById = function(id, callback) {
  model.findOne({ _id: id }, function(err, doc){	
	if (typeof callback === 'function') callback(err, doc);
  });
}

module.exports = {
  Schema: schema,
  Model: model
}