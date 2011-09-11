var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  title: String,
  type: String,
  description: String,
  image: String,
  price: Number
});

var model = mongoose.model('Item', schema);

module.exports = {
  Schema: schema,
  Model: model
}