var connectToLobby = function (socket) {
	
}

module.exports = {
  listen: function(app, socket) {
    socket.on('connection', connectToLobby );
  }
}