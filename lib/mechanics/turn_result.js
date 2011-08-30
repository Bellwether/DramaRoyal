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

TurnResult.prototype.addTarget = function(userId, nick){
  var target = {'userId': userId, 'nick': nick};
  this.targets.push(target);
}

module.exports = {
  TurnResult: TurnResult
}