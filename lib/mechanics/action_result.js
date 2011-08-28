function ActionResult(userId, action, seededActionResult) {
  this.userId = userId; // expected
  this.action = action; // expected
  this.attacks = (seededActionResult || {}).attacks || []; // may have been seeded earlier
  this.esteem = 0; // track esteem lost or gained
  this.effective = true;
}

ActionResult.prototype.trackHumiliation = function (){
  this.humiliated = true; // set humiliation flag for reference
}

ActionResult.prototype.isHumiliated = function (){
  return this.humiliated === true;
}

ActionResult.prototype.defective = function () {
  this.effective = false;	
}

ActionResult.prototype.coward = function () {
  this.coward = true;	
}

ActionResult.prototype.deductEsteem = function (esteemLost) {
  this.esteem = this.esteem - esteemLost;	
}

ActionResult.prototype.isEffective = function () {
  return this.effective === true;
}

module.exports = {
  ActionResult: ActionResult
}