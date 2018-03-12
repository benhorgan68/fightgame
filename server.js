//server for fighting game

var port = 8080,
express = require('express'),
app = express().use(express.static(__dirname + '/')),
http = require('http').Server(app),
io = require('socket.io')(http);

var player1, player2;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', onConnection);

http.listen(port, function(){
    console.log("Node server listening on port " + port);
});

function onConnection(sock) {
	//sock.emit('msg', 'Hello!');
	sock.on('msg', (txt) => io.emit('msg', txt));
	/*if(player1 && player2) {
		//sock.emit('msg', 'You are spectating.');
		sock.emit('pl', 'Spectator');
	} else */ if (player1 && sock != player1) {
		//match starts
		player2 = sock;
		//player2.emit('msg', 'Player 2');
		player2.emit('pl', 'Player 2');
		//sock.on('msg', (txt) => player1.emit('msg', txt));
		notifyMatchStarts(player1, sock);
	} else {
		player1 = sock;
		//player1.emit('msg', 'Player 1');
		player1.emit('pl', 'Player 1');
	}

	/*if(player2) {
		if(sock == player1) {
			sock.on('msg', (txt) => player2.emit('msg', txt));
		} 
		if(sock == player2) {
			sock.on('msg', (txt) => player1.emit('msg', txt));
		}
	}*/

	/*sock.on('disconnect', function(){
		if(sock == player1) {
			//io.emit('msg', 'Player 1 disconnected');
			player1 = player2;
		} else if (sock == player2) {
			//io.emit('msg', 'Player 2 disconnected');
		}
		player2 = null;
		if(player1)
			player1.emit('pl', 'Player 1');
	});*/
}

function notifyMatchStarts(sockA, sockB) {
	//[sockA, sockB].forEach((sock) => sock.emit('msg', 'Match starts'));
}
