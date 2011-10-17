var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  title: String,
  slug: {type: String, unique: true},
  description: String,
  image: String,
  url: String,
  points: Number,
  order: Number
});

var model = mongoose.model('Achievement', schema);

model.findBySlug = function(slug, callback) {
  model.findOne({ slug: slug }, function(err, doc) {
    doCallback(callback, err, doc);
  });
}

module.exports = {
  Schema: schema,
  Model: model
}