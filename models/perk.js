var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  title: String,
  description: String,
  image: String,
  url: String,
  price: Number,
  data: {}
});

module.exports = {
  Schema: schema
}