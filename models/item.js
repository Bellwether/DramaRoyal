var usr = require('./../models/user').Model;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

function doCallback(callback, err, data) {
  if (typeof callback === 'function') {
	callback(err, data);	
  }
}

var schema = new Schema({
  title: String,
  type: String,
  action: String,
  description: String,
  image: String,
  price: Number
});

var model = mongoose.model('Item', schema);

model.prototype.purchase = function(userId, callback) {
  var params = {'_id': this._id, 'title': this.title, 'type': this.type};
  var price = this.price;

  usr.findById(userId, function(err, doc) {
	if (doc) {
	  if (doc.money && doc.money >= price) {
        doc.money = doc.money - price;
        doc.items.push(params);

		doc.save(function (err, doc) {
		  doCallback(callback, err, doc);
		});		
	  } else {
		doCallback(callback, "Not enough money to purchase");
	  }
	} else {
	  doCallback(callback, err);
	}
  });  
}

model.findForUserId = function(id, callback) {
  usr.findById(id, ['items'], function (err, docs){
    // docs is an array of partially-`init`d documents
    console.log("item findForUserId "+JSON.stringify(docs));
    doCallback(callback, err, docs)
  })	
}

module.exports = {
  Schema: schema,
  Model: model
}