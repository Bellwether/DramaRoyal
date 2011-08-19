var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
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