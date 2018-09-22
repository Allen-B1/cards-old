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
	socket.on("player_join", function(name, roomId) {
		const room = rooms[roomId] = rooms[roomId] || new Room();
		const uid = room.addPlayer(name);
		if(uid === null) {
			socket.emit("join_error", "Game already started");
			socket.disconnect();
			return;
		}
		socket.join("game-" + roomId);

		// If the player attempts to join again, fail
		socket.removeAllListeners("player_join");
		socket.on("player_join", function() {
			socket.emit("join_error", "Already in game; cannot join twice");
		});

		const roomIo = io.to(roomId);
		socket.emit("player_uid", uid);
		roomIo.emit("player_join", uid, name);
		roomIo.emit("set_start", [room.nstarts, room.nstartsRequired]);

		var onStartListener;
		socket.on("disconnect", function() {
			room.removeListener("game_start", onStartListener);
			room.leave(uid);
			if(!room.started)
				roomIo.emit("set_start", [room.nstarts, room.nstartsRequired]);
		});	

		socket.on("set_start", function() {
			room.setStart(uid);
			roomIo.emit("set_start", [room.nstarts, room.nstartsRequired]);
		});	

		room.on("game_start", onStartListener = function() {
			let game = room.game = room.game || new gamelib.PresGame(Object.keys(room.names));

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

			socket.emit("game_start", room.names, hands);
		});

		socket.on("game_move", function() {
			try {
				if(room.move(uid, move)) {
					roomIo.emit("game_move", uid, move);
					roomIo.emit("game_win", uid);
				} else {
					roomIo.emit("game_move", uid, move);
				}
			} catch(err) {
				roomIo.emit("game_error", String(err));
			}
		});

		room.on("player_left", function(player) {
			roomIo.emit("player_left", player);
		});

		room.on("chat", function(msg) {
			roomIo.emit("chat", msg, uid);
		});
	});
});


