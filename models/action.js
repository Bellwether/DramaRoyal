var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

function required(val) { return val && val.length; }

var GAME_COMMANDS = ['med','nothing','cower','tattle','scratch','grab','tease'];

var schema = new Schema({
  userId: ObjectId,
  cmd: { type: String, default: 'nothing', enum: GAME_COMMANDS, validate: required},
  targetId: ObjectId
});

module.exports = {
  Schema: schema
}