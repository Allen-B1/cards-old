const http = require('http');
const fs = require('fs');
const gamelib = require("./game.js");

const server = http.createServer((req, res) => {
	if(req.url == "/socket.io.js") {
		res.writeHead(200, {"Content-Type": "text/javascript"});	
		res.write(fs.readFileSync("socket.io.js"));
	} else {
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(fs.readFileSync("text.html"));
	}
	res.end();

}); 
server.listen(8000, () => {
	console.log("Listening on 127.0.0.1:8000");
});


var rooms = {};
const io = require('socket.io')(server);

function start(id) {
	var sockets = rooms[id].sockets;
	var names = rooms[id].names;
	var game = rooms[id].game = gamelib.PresGame(names);
	
	// For each player and socket
	sockets.forEach((socket, player) => {
		// Create object to feed containing only the hand of the player, and null for everything else
		var hands = Array(names.length);
		hands.forEach((hand, hand_player) => {
			if(player === hand_player) {
				hands[hand_player] = game.hands[hand_player];
			} else {
				// Create an array of nulls of the correct length
				hands[hand_player] = Array(game.hands[hand_player].length);
				hands[hand_player].fill(null);
			}
		});
		socket.emit("start", hands);
	});

	console.log("started", id);


	sockets[game.turn].emit("turn");
}

function newRoom(id) {
	if(!(id in rooms)) {
		rooms[id] = {};
		rooms[id].sockets = [];
		rooms[id].names = [];
		rooms[id].game = null;
		rooms[id].startSet = new Set();
		rooms[id].id = id;
	}
	return rooms[id];
}

newRoom("game");

io.on("connection", (socket) => {
	console.log("Connection");
	socket.on("player", function(name) {
		console.log("Player: ", name);
		socket.join("game");
		var room = newRoom("game");
		if(room.game == null) {
			room.names.push(name);
			const index = room.names.length - 1;
			room.sockets[index] = socket;
			socket.on("start", function() {
				room.startSet.add(index);
				if(room.startSet.length == room.names.length || room.startSet.length >= 4) {
					start(room.id);
				}
			});
		} else {
			socket.emit("error", "Game already started!");
		}
	});
});


