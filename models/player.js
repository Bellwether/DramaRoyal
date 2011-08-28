var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var playerStatus = ['pending', 'active', 'quit', 'shamed'];

var schema = new Schema({
  userId: ObjectId,
  nick: String,
  status: { type: String, default: 'pending', enum: playerStatus},
  esteem: { type: Number, default: 10 },
  tattles: { type: Number, default: 2 },
  meds: { type: Number, default: 3 }
});
var model = mongoose.model('Player', schema);

module.exports = {
  Schema: schema,
  Model: model
}
