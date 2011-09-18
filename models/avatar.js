var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

function required(val) { return val && val.length; }

var schema = new Schema({
  nick: {type: String, validate: required},
  bio: String
});
var model = mongoose.model('Avatar', schema);

module.exports = {
  Schema: schema,
  Model: model
}