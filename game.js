"use strict";
const EventEmitter = require('events');
class Game extends EventEmitter {
	// players: Array of player info
	get players() {
		return this._players;
	}
	addPlayer(player) {
		if(!this._started) {
			this._players.push(player);
			this.emit("player", this._players.length - 1, player);
		} else {
			throw new Error;
		}
	}
	
	get turn() {
		return this._turn;
	}

	move(player, move) {
		if(this._started && this.isLegalMove(move)) {
			this.emit("move", this._turn, move);
			this._turn = (this._turn + 1) % this._players.length;
		}
	}

	start() {
		this._started = true;
		this.emit("start");
	}

	constructor() {
		this._started = false;
		this._turn = 0;
		this._players = [];
	}
}

class PresGame extends Game {
	constructor() {
		super();
		this.stackTop = null;

		this.on("move", (playerId, move) {
			this.stackTop = move;			
		});
	}
	isLegalMove(move) {

	}
}
