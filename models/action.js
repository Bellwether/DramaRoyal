var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  userId: Number,	
  cmd: String,
  targetId: Number
});

module.exports = {
  Schema: schema
}