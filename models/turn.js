var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var act = require('./action');

var schema = new Schema({
  cnt: Number,	
  actions: [act.Schema],
  ts: {type: Date, default: Date.now()}
});

module.exports = {
  Schema: schema
}