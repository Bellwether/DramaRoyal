var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  nick: String
});
var model = mongoose.model('Avatar', schema);

module.exports = {
  Schema: schema,
  Model: model
}