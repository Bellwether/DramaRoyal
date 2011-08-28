function TurnResult() {
  this.description = null;
  this.targets = []; 
  this.attackers = [];
}

TurnResult.prototype.trackPlayerTattleUse = function (userId){
  this.tattles = this.tattles || [];
  this.tattles.push(userId);
}

TurnResult.prototype.trackPlayerMedUse = function(userId){
  this.meds = this.meds || [];
  this.meds.push(userId);
}

TurnResult.prototype.trackPlayerHumiliation = function(userId){
  this.humiliations = this.humiliations || [];
  this.humiliations.push(userId);
}

module.exports = {
  TurnResult: TurnResult
}