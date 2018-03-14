//server for fighting game

var port = 8080,
express = require('express'),
app = express().use(express.static(__dirname + '/')),
http = require('http').Server(app),
io = require('socket.io')(http);

var player1, player2;
var player = [];

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', onConnection);

http.listen(port, function(){
    console.log("Node server listening on port " + port);
});

function onConnection(sock) {
	sock.on('i', (txt) => io.emit('i', txt));
	sock.on('msg', (txt) => io.emit('msg', txt));
	
	var i = 0;
	while(player[i]) {
		i++;
	}
	player[i] = sock;
	io.emit('pl', i);

	sock.on('disconnect', function(){
		player[i] = null;
		io.emit('d', i)
	});
}