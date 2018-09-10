"use strict";
const http = require('http');
const fs = require('fs');
const gamelib = require("./game.js");
const Room = require("./room_v2.js");

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

io.on("connection", (socket) => {
	socket.on("player_join", function(name, roomId) {
		socket.join(roomId);
		if(!(roomId in rooms)) 
			rooms[roomId] = new Room();
		const room = rooms[roomId];

		const uid = room.addPlayer(name, socket);
		if(uid == null) {
			socket.emit("join_error", "Game already started!");
			socket.disconnect(false);
			return;
		}

		socket.emit("player_uid", uid);
		io.to(roomId).emit("player_join", uid, name);

		// Handling chat
		socket.on("chat", function(msg) {
			io.to(roomId).emit("chat", msg, uid);
		});

		/// The following should be moved to room.js
		/* When socket sets force start */
		socket.on("set_start", function() {
			if(room.setStart(uid)) {
				room.game = new PresGame(room.nplayers);
				room.start();
			}
			io.to(roomId).emit("set_start", [room.nstarted, room.nstartsRequired]);
		});

		socket.on("game_move", function(playerIndex, move) {
			if(room.game !== null) {
				try {
					room.game.move(started)
					io.to(roomId).emit("game_move", playerIndex, move);
				} catch(err) {
					socket.emit("game_error", String(err));
				}
			}
		});

		room.on("game_start", function() {
			const playerIndex = Object.keys(room.names).indexOf(uid);

			var hands = Array(room.nplayers);
			hands.fill(null);
			hands.forEach((hand, hand_player) => {
				if(player === hand_player) {
					hands[hand_player] = room.game.hands[hand_player];
				} else {
					// Create an array of nulls of the correct length
					hands[hand_player] = Array(room.game.hands[hand_player].length);
					hands[hand_player].fill(null);
				}
			});

			socket.emit("game_start", Object.keys(room.names), hands);
		});

		socket.on("disconnect", function() {
			room.leave(uid);
			io.to(roomId).emit("player_left", uid);
		});
	});
});


