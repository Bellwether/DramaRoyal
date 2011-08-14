var GAMES_CHANNEL = 'games';

function gameIdFromUrl() {
  var urlParts = window.location.toString().split('/'); 
  var gameId = urlParts[ urlParts.length-1 ].split('?')[0].replace('#','');
  return gameId;
}

function isAuthenticated() {
  return true;	
}

function joinLobby(socket, userId) {
  // get game id from url
	
  socket.join(LOBBY_CHANNEL);
  socket.set('userId', userId, function (){
	socket.set('userName', 'girl'+(userId || '').substr(0,4), function (){ 
	  initLobbySocket(socket) 
	});
  });	
}

var connectToGame = function (socket) {
  console.log("++ new socket connection");
	
  socket.once('authorizeUser', function (sessionId) {
	var userId;
	
    if (isAuthenticated()) {
	  joinGame(socket, userId);
	} else {
      socket.disconnect();	
      return;
    }
  });
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToGame );
  }
}