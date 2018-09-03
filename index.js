const http = require('http');
const fs = require('fs');
const gamelib = require("./game.js");

const server = http.createServer((req, res) => {
	if(req.url == "/socket.io.js") {
		res.writeHead(200, {"Content-Type": "text/javascript"});	
		res.write(fs.readFileSync("socket.io.js"));
	} else {
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(fs.readFileSync("index.html"));
	}
	res.end();

}); 
server.listen(8000, () => {
	console.log("Listening on 127.0.0.1:8000");
});

const gamedata = gamelib.PresGame();
const playerSockets = [];
const io = require('socket.io')(server);

io.on("connection", (socket) => {
	socket.on("player", function(name, game_id) {
		var index = gamedata.addPlayer(name);
		playerSockets[index] = socket;
	}
});

io.on("start", (id) => {
	gamedata.start();
	gamedata.move(0, 10);
});
