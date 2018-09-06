"use strict";
const http = require('http');
const fs = require('fs');
const gamelib = require("./game.js");
const Room = require("./room.js");

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
	socket.on("player", function(name, roomId) {
		socket.join(roomId);
		if(!(roomId in rooms)) 
			rooms[roomId] = new Room(roomId, gamelib.PresGame, io);
		const room = rooms[roomId];

		if(room.addPlayer(name, socket) < 0) {
			socket.emit("join_error", "Game already started!");
			socket.disconnect(false);
		}

		// Handling chat
		socket.on("chat", function(msg) {
			let playerId = room.getPlayer(socket);
			if(playerId >= 0)
				room.emit("chat", msg, room.names[playerId]);
		});


		/// The following should be moved to room.js
		/* When socket sets force start */
		socket.on("set_start", function() {
			let playerId = room.getPlayer(socket);
			if(playerId >= 0)
				room.setStart(playerId);
		});

		socket.on("disconnect", function() {
			var index = room.getPlayer(socket);
			if(!room.started) {
				room.emit("player_left", room.names[index], null);

				room.sockets.splice(index, 1);
				room.names.splice(index, 1);
				room.started.splice(index, 1);
			} else {
				room.emit("player_left", room.names[index], index);
				room.names[index] = null;
				// If everyone left
				if(room.names.every((v) => v === null)) {
					clearRoom(room.id);
				}
			}
		});
	});


});


