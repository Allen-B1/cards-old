"use strict";
const http = require('http');
const fs = require('fs');
const gamelib = require("./game.js");
const Room = require("./room_v2.js");

const server = http.createServer((req, res) => {
	switch(req.url) {
		case "/socket.io.js":
			res.writeHead(200, {"Content-Type": "text/javascript"});	
			res.write(fs.readFileSync("socket.io.js"));
			res.end();
			break;
		case "/text":			
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(fs.readFileSync("text.html"));
			res.end();
			break;
		default:
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(fs.readFileSync("index.html"));
			res.end();
	}

}); 
server.listen(8000, () => {
	console.log("Listening on 127.0.0.1:8000");
});


var rooms = {};
const io = require('socket.io')(server);

io.on("connection", (socket) => {
	let joined = false;
	socket.on("player_join", function(name, roomId) {
		if(joined) {
			socket.emit("join_error", "Already joined");
			return;
		}
		joined = true;

		socket.join(roomId);
		if(!(roomId in rooms)) 
			rooms[roomId] = new Room();
		const room = rooms[roomId];

		const uid = room.addPlayer(name, socket);
		if(uid == null) {
			socket.emit("join_error", "Game already started");
			socket.disconnect(false);
			return;
		}

		socket.emit("player_uid", uid);
		io.to(roomId).emit("player_join", uid, name);
		io.to(roomId).emit("set_start", [room.nstarts, room.nstartsRequired]);

		socket.on("disconnect", function() {
			room.leave(uid);
			room.removeListener("game_start", onGameStart);
			io.to(roomId).emit("player_left", uid);
			io.to(roomId).emit("set_start", [room.nstarts, room.nstartsRequired]);
		});

		/* When socket sets force start */
		socket.on("set_start", function() {
			let started = room.setStart(uid);
			io.to(roomId).emit("set_start", [room.nstarts, room.nstartsRequired]);
			if(started) {
				room.game = new gamelib.PresGame(room.nplayers);
				room.start();
			}
		});

		function onGameStart() {
			const playerIndex = Object.keys(room.names).indexOf(String(uid));

			// Create hands
			var hands = Array(room.nplayers);
			hands.fill(null);
			// For each hand
			hands.forEach((hand, hand_player) => {
				if(playerIndex === hand_player) { // If can see
					hands[hand_player] = room.game.hands[hand_player];
				} else {
					// Create an array of nulls of the correct length
					hands[hand_player] = Array(room.game.hands[hand_player].length);
					hands[hand_player].fill(null);
				}
			});

			// Give information to socket
			socket.emit("game_start", room.names, Object.keys(room.names).map(x => Number(x)), hands);
		}
		room.on("game_start", onGameStart);


		socket.on("game_move", function(move) {
			const playerIndex = Object.keys(room.names).indexOf(String(uid));
			if(room.game !== null) {
				try {
					let won = room.game.move(playerIndex, move);
					io.to(roomId).emit("game_move", playerIndex, move);
					if(won) {
						io.to(roomId).emit("game_win", uid);
						// If everyone won except for one person, end the game
						if(room.game.winners.length >= room.nplayers - 1) {
							io.to(roomId).emit("game_end");
						}
					}
				} catch(err) {
					socket.emit("game_error", String(err));
				}
			}
		});

		socket.on("chat", function(msg) {
			io.to(roomId).emit("chat", msg, uid);
		});
	});
});


