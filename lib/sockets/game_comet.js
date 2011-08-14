function isAuthenticated() {
  return true;	
}

function joinGame(socket, userId) {
	
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