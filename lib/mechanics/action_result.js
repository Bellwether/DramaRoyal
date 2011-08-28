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

module.exports = {
  ActionResult: ActionResult
}