//server for fighting game

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://heroku_w1c4vq5z:db7oj81sdj4jth5h4ssgl7ajj8@ds251622.mlab.com:51622/heroku_w1c4vq5z";
var port,
express = require('express'),
app = express().use(express.static(__dirname + '/')),
http = require('http').Server(app),
io = require('socket.io')(http);

var player = [];

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', onConnection);

port = process.env.PORT || 3000;
http.listen(port, function(){
    console.log("Node server listening on port " + port);
});

function onConnection(sock) {
	sock.on('i', (txt) => io.emit('i', txt));
	sock.on('msg', (txt) => io.emit('msg', txt));
	
	sock.on('reg', function(data) {
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("heroku_w1c4vq5z");
			var collection = dbo.collection("test");
			collection.findOne({username: data.username}, function(err, result) {
				if (err) throw err;
				if(result == null){
					var myobj = data;
					collection.insertOne(myobj, function(err, res) {
						if (err) throw err;
						console.log("1 document inserted");
						sock.emit('rerr', myobj);
					});
				}
				else {
					sock.emit('rerr', "Username is unavailable!");
				}
				db.close();
			})
		});
		console.log(data);
	});
	
	sock.on('log', function(data) {
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("heroku_w1c4vq5z");
			var collection = dbo.collection("test");
			collection.findOne({username: data.username}, function(err, result) {
				if (err) throw err;
				if(result == null){
					sock.emit('lerr', "User not found!");
				}
				else {
					if(data.password != result.password) {
						sock.emit('lerr', "Incorrect username or password!");
					} else {
						sock.emit('lerr', result);
					}
				}
				db.close();
			})
		});
		console.log(data);
	});
	
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