var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  userId: ObjectId,
  cmd: String,
  targetId: ObjectId
});

module.exports = {
  Schema: schema
}