var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Avatar = require('./avatar').Schema;

var schema = new Schema({
  name: String,
  full: String,
  fbId: { type: String, index: {unique:true} },
  token: String,
  sex: String,
  ts: { type: Date, default: Date.now },
  avatar: [Avatar]
});
var model = mongoose.model('User', schema);

module.exports = {
  Schema: schema,
  Model: model
}