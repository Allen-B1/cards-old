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
			if(!room.started)
				io.to(roomId).emit("set_start", [room.nstarts, room.nstartsRequired]);
		});

		/* When socket sets force start */
		socket.on("set_start", function() {
			let started = room.setStart(uid);
			io.to(roomId).emit("set_start", [room.nstarts, room.nstartsRequired]);
			if(started) {
				room.game = new gamelib.PresGame(Object.keys(room.names));
				room.start();
			}
		});

		function onGameStart() {
			// Create hands		
			var hands = {};
			for(var player in room.names) {
				if(player === uid) {
					hands[player] = room.gameHands[player];
				} else {
					hands[player] = Array(room.gameHands[player].length);
					hands[player].fill(null);
				}
			}

			// Give information to socket
			socket.emit("game_start", room.names, hands);
		}
		room.on("game_start", onGameStart);


		socket.on("game_move", function(move) {
			if(!room.started) return;

			try {
				let won = room.move(uid, move);
				io.to(roomId).emit("game_move", uid, move);
				if(won) {
					console.log("Won");
					io.to(roomId).emit("game_win", uid);
					room.leave(uid);
				}
			} catch(err) {
				socket.emit("game_error", String(err));
			}
		});

		room.on("player_left", function() {
			// If everyone left except for one person, end the game
			if(room.nplayers <= 1) {
				io.to(roomId).emit("game_end");
				room.clear();
			}
		});


		socket.on("chat", function(msg) {
			io.to(roomId).emit("chat", msg, uid);
		});
	});
});


