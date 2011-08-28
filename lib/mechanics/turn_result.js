function TurnResult() {
  this.description = null;
  this.targets = []; 
  this.attackers = [];
}

TurnResult.prototype.trackPlayerTattleUse = function (userId){
  this.tattles = this.tattles || [];
  this.tattles.push(userId);
}

TurnResult.prototype.trackPlayerLickUse = function(userId){
  this.licks = this.licks || [];
  this.licks.push(userId);
}

TurnResult.prototype.trackPlayerHumiliation = function(userId){
  this.humiliations = this.humiliations || [];
  this.humiliations.push(userId);
}

module.exports = {
  TurnResult: TurnResult
}