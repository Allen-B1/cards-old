"use strict";
class Room {
	constructor(id, gameclass, io) {
		// readonly from outside
		this.sockets = [];
		this.names = [];
		this.game = null;
		this.gameclass = gameclass;
		this.forceStarts = [];
		this.id = id;
		this.io = io;
	}

	clear() {
		this.sockets = [];
		this.names = [];
		this.game = null;
		this.forceStarts = [];
	}
	
	/* Adds player. Returns the playerId. NOTE: playerId may change. Do not use */
	addPlayer(name, socket) {
		if(!this.started) {
			this.names.push(name);
			let index = this.names.length - 1;
			this.sockets[index] = socket;
			this.forceStarts[index] = false;

			this.emit("player", name);

			return index;
		} else {
			return -1;
		}
	}

	getPlayer(socket) {
		return this.sockets.indexOf(socket);
	}

	setStart(index) {
		if(this.started)
			return;

		this.forceStarts[index] = true;
		var nstarted = this.forceStarts.reduce((acc, val) => acc + val, 0);
		var required = Math.max(this.names.length >= 4 ? this.names.length - 1 : this.names.length, 2);

		this.emit("set_start", this.names[index], [nstarted, required]);

		if(nstarted >= required)
			this._start();
	}

	_start() {
		this.game = new this.gameclass(this.names.length);

		// For each player and socket
		this.sockets.forEach((socket, player) => {
			// Create object to feed containing only the hand of the player, and null for everything else
			var hands = Array(this.names.length);
			hands.fill(null);
			hands.forEach((hand, hand_player) => {
				if(player === hand_player) {
					hands[hand_player] = this.game.hands[hand_player];
				} else {
					// Create an array of nulls of the correct length
					hands[hand_player] = Array(this.game.hands[hand_player].length);
					hands[hand_player].fill(null);
				}
			});
			socket.emit("start", player, this.names, hands);

			// When move recieved
			socket.on("move", (move) => {
				try {
					this.game.move(player, move);
					this.emit("move", move, player);
				} catch(err) {
					socket.emit("move_error", move, err);
				}
			});
		});
	}

	emit() {
		this.io.to(this.id).emit.apply(this.io.to(this.id), Array.from(arguments));
	}

	get started() {
		return this.game !== null;
	}
}

module.exports = Room;
