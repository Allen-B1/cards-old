const socket = require('socket.io-client').connect('http://127.0.0.1:8000');
const rl = require("readline").createInterface({input: process.stdin, output: process.stdout});

let names = {};

rl.on("line", function(str) {
	if(str[0] === "/") {
		var args = str.split(" ");
		switch(args[0]) {
			case "/join":
				socket.emit("player_join", args[1], args[2] || "game");
				break;
			case "/start":
				socket.emit("set_start");
				break;
		}
	}
	rl.prompt();
});

socket.on("disconnect", function() {
	console.log("\033[31mDisconnected\033[39m");
	process.exit(0);
});

socket.on("join_error", function(msg) {
	console.log("\033[31m" + msg + "\033[39m");
});

socket.on("player_join", function(uid, name) {
	console.log("\033[34m" + name + " joined\033[39m");
	names[uid] = name;
});

socket.on("set_start", function(data) {
	rl.pause();
	console.log("\033[33m" + "start " + data[0] + "/" + data[1] + "\033[39m");
	rl.resume();
});

socket.on("connect", function() {
	rl.prompt()
});
