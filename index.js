"use strict";
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

function start(room) {
	var game = room.game = new gamelib.PresGame(room.names.length);

	// For each player and socket
	room.sockets.forEach((socket, player) => {
		// Create object to feed containing only the hand of the player, and null for everything else
		var hands = Array(room.names.length);
		hands.fill(null);
		hands.forEach((hand, hand_player) => {
			if(player === hand_player) {
				hands[hand_player] = game.hands[hand_player];
			} else {
				// Create an array of nulls of the correct length
				hands[hand_player] = Array(game.hands[hand_player].length);
				hands[hand_player].fill(null);
			}
		});
		socket.emit("start", player, room.names, hands);

		// When move recieved
		socket.on("move", (move) => {
			let err = game.move(player, move);
			if(err === null) // valid
				io.to(room.id).emit("move", move, player);
			else  // invalid
				socket.emit("move_error", err);
		});
	});
}

function newRoom(id) {
	if(!(id in rooms)) {
		rooms[id] = {};
		rooms[id].sockets = [];
		rooms[id].names = [];
		rooms[id].game = null;
		rooms[id].started = [];
		rooms[id].id = id;
	}
	return rooms[id];
}

io.on("connection", (socket) => {
	socket.on("player", function(name, roomId) {
		console.log("Player: ", name);
		socket.join(roomId);
		var room = newRoom(roomId);

		// Handling chat
		socket.on("chat", function(msg) {
			var index = room.sockets.indexOf(socket);
			io.to(room.id).emit("chat", msg, room.names[index]);
		});

		// If the game hasn't started
		if(room.game == null) {
			// Add the player to the room
			room.names.push(name);
			let index = room.names.length - 1;
			room.sockets[index] = socket;
			room.started[index] = false;

			// Broadcast new player
			io.to(room.id).emit("player", name);

			/* When socket sets force start */
			socket.on("set_start", function() {
				if(room.game !== null)
					return;

				var index = room.sockets.indexOf(socket);
				room.started[index] = true;

				var nstarted = room.started.reduce((acc, val) => acc + val, 0);
				var required = Math.max(room.names.length >= 4 ? room.names.length - 1 : room.names.length, 2);
				io.to(room.id).emit("set_start", room.names[index], [nstarted, required]);

				if(nstarted >= required) {
					start(room);
				}
			});

			socket.on("disconnect", function() {
				var index = room.sockets.indexOf(socket);
				if(room.game === null) {
					io.to(room.id).emit("player_left", room.names[index], null);

					room.sockets.splice(index, 1);
					room.names.splice(index, 1);
					room.started.splice(index, 1);
				} else {
					io.to(room.id).emit("player_left", room.names[index], index);					
				}
			});
		} else {
			socket.emit("join_error", "Game already started!");
		}
	});


});


